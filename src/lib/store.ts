import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Lead,
  CadenceStage,
  Meeting,
  Project,
  Task,
  CadenceTemplate,
  CadenceStageNumber,
  KillSwitchStatus,
  MeetingOutcome,
  LeadResponseStatus,
  Niche,
  CRMTab,
  StageViewStatus,
  SenderProfile,
} from '@/types/crm';
import { getInitialSeedData, DEFAULT_NICHES, DEFAULT_SENDER_PROFILES } from './seed-data';
import { addDays, CADENCE_INTERVAL_DAYS, getTodayISO, STAGE_TITLES } from './date-utils';
import { buildWhatsAppUrl, getPrefilledMessageForStage, WIN_BACK_TEMPLATES, interpolateTemplate } from './whatsapp';
import { parsePhoneAndDetectCountry, sanitizePhoneForWhatsApp } from './phone';
import { syncLeadToSupabase } from './supabase-sync';
import { classifyLeadNiche } from './classifier';

interface CRMState {
  leads: Lead[];
  stages: CadenceStage[];
  meetings: Meeting[];
  projects: Project[];
  tasks: Task[];
  templates: CadenceTemplate[];
  niches: Niche[];
  senderProfiles: SenderProfile[];
  activeSenderProfileId: string;
  activeTab: CRMTab;
  searchQuery: string;
  selectedNicheFilter: string;
  dailyGoal: number;
  streakDays: number;

  // Actions
  setActiveTab: (tab: CRMTab) => void;
  setSearchQuery: (q: string) => void;
  setSelectedNicheFilter: (niche: string) => void;
  resetToSampleData: () => void;
  restoreDatabase: (backupData: any) => void;
  setDailyGoal: (goal: number) => void;
  incrementStreak: () => void;

  // Sender Profiles
  setActiveSenderProfile: (id: string) => void;
  addSenderProfile: (profile: Omit<SenderProfile, 'id'>) => SenderProfile;
  deleteSenderProfile: (id: string) => void;

  // Snooze Action
  snoozeStage: (stageId: string, newDate: string, reason?: string) => void;

  // Niche Actions
  addNiche: (input: { name: string; description?: string; color?: string; targetAudience?: string }) => Niche;
  deleteNiche: (id: string) => void;

  // Lead Actions
  addLead: (leadInput: {
    name?: string;
    phoneRaw: string;
    company?: string;
    email?: string;
    website?: string;
    source?: Lead['source'];
    niche?: string;
    value?: number;
    tags?: string[];
    queueForToday?: boolean;
  }) => Lead;
  addBulkLeads: (
    leadsInput: Array<{
      name: string;
      phoneRaw: string;
      company?: string;
      email?: string;
      website?: string;
      source?: Lead['source'];
      niche?: string;
    }>,
    defaultNiche?: string,
    queueCountImmediately?: number
  ) => number;
  autoClassifyAllLeadsNiches: () => { agencyCount: number; developerCount: number; updatedCount: number };
  queueLeadForToday: (leadId: string) => void;
  queueBatchLeadsForToday: (leadIds: string[]) => number;
  queueFromPool: (count: number, niche?: string) => number;
  removeFromTodayQueue: (leadId: string) => void;
  moveAllUnsentStage0ToPool: () => number;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  setKillSwitch: (leadId: string, status: KillSwitchStatus, reason?: string) => void;
  setResponseStatus: (leadId: string, status: LeadResponseStatus) => void;
  setLeadNote: (leadId: string, note: string) => void;

  // Cadence Actions
  sendAndAutoAdvance: (stageId: string, customMessage?: string) => { whatsappUrl: string; nextStageCreated?: CadenceStage };
  markSentAndAdvance: (stageId: string) => void;
  advanceLeadStage: (leadId: string) => void;
  setStageViewStatus: (stageId: string, status: StageViewStatus) => void;
  resumeCadence: (leadId: string) => void;
  reviveLead: (leadId: string, customMessage?: string) => { whatsappUrl: string };
  updateStage: (stageId: string, updates: Partial<CadenceStage>) => void;

  // Meeting Actions
  addMeeting: (meetingInput: Omit<Meeting, 'id' | 'createdAt'>) => Meeting;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  setMeetingOutcome: (id: string, outcome: MeetingOutcome, dealValue?: number, rescheduleNotes?: string) => void;
  deleteMeeting: (id: string) => void;

  // Project Actions
  addProject: (projectInput: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Task Actions
  addTask: (taskInput: Omit<Task, 'id' | 'createdAt'>) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  // Template Actions
  updateTemplate: (id: string, content: string) => void;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      ...getInitialSeedData(),
      activeTab: 'today',
      searchQuery: '',
      selectedNicheFilter: 'all',
      dailyGoal: 20,
      streakDays: 0,
      senderProfiles: getInitialSeedData().senderProfiles || DEFAULT_SENDER_PROFILES,
      activeSenderProfileId: 'sender-primary',

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedNicheFilter: (niche) => set({ selectedNicheFilter: niche }),
      setDailyGoal: (goal) => set({ dailyGoal: Math.max(1, goal) }),
      incrementStreak: () => set((s) => ({ streakDays: (s.streakDays || 0) + 1 })),

      setActiveSenderProfile: (id) => set({ activeSenderProfileId: id }),

      addSenderProfile: (profile) => {
        const id = `sender-${Date.now()}`;
        const newProfile: SenderProfile = {
          id,
          name: profile.name.trim(),
          phone: profile.phone.trim(),
          isDefault: Boolean(profile.isDefault),
        };
        set((state) => ({
          senderProfiles: [...(state.senderProfiles || []), newProfile],
        }));
        return newProfile;
      },

      deleteSenderProfile: (id) => {
        set((state) => {
          const remaining = (state.senderProfiles || []).filter((p) => p.id !== id);
          return {
            senderProfiles: remaining,
            activeSenderProfileId:
              state.activeSenderProfileId === id
                ? remaining[0]?.id || 'sender-primary'
                : state.activeSenderProfileId,
          };
        });
      },

      snoozeStage: (stageId, newDate, reason) => {
        const today = getTodayISO();
        const stage = get().stages.find((s) => s.id === stageId);
        if (!stage) return;

        const lead = get().leads.find((l) => l.id === stage.leadId);
        const reasonText = reason ? ` (${reason})` : '';
        const noteEntry = `[${today}] ⏰ Snoozed to ${newDate}${reasonText}`;
        const updatedNotes = lead?.notes ? `${lead.notes}\n${noteEntry}` : noteEntry;

        set((state) => ({
          stages: state.stages.map((st) =>
            st.id === stageId ? { ...st, scheduledDate: newDate, notes: noteEntry } : st
          ),
          leads: lead
            ? state.leads.map((ld) =>
                ld.id === lead.id ? { ...ld, notes: updatedNotes, updatedAt: today } : ld
              )
            : state.leads,
        }));
      },

      resetToSampleData: () => {
        set({
          ...getInitialSeedData(),
          searchQuery: '',
          selectedNicheFilter: 'all',
          dailyGoal: 20,
          streakDays: 0,
          senderProfiles: DEFAULT_SENDER_PROFILES,
          activeSenderProfileId: 'sender-primary',
        });
      },

      restoreDatabase: (backupData: any) => {
        if (!backupData || !backupData.data) return;
        const d = backupData.data;
        set({
          leads: Array.isArray(d.leads) ? d.leads : [],
          stages: Array.isArray(d.stages) ? d.stages : [],
          meetings: Array.isArray(d.meetings) ? d.meetings : [],
          projects: Array.isArray(d.projects) ? d.projects : [],
          tasks: Array.isArray(d.tasks) ? d.tasks : [],
          niches: Array.isArray(d.niches) && d.niches.length > 0 ? d.niches : DEFAULT_NICHES,
          templates: Array.isArray(d.templates) && d.templates.length > 0 ? d.templates : getInitialSeedData().templates,
          senderProfiles: Array.isArray(d.senderProfiles) && d.senderProfiles.length > 0 ? d.senderProfiles : DEFAULT_SENDER_PROFILES,
          activeSenderProfileId: d.activeSenderProfileId || 'sender-primary',
          dailyGoal: typeof d.dailyGoal === 'number' ? d.dailyGoal : 20,
          streakDays: typeof d.streakDays === 'number' ? d.streakDays : 4,
          searchQuery: '',
          selectedNicheFilter: 'all',
        });
      },

      addNiche: (input) => {
        const id = `niche-${Date.now()}`;
        const newNiche: Niche = {
          id,
          name: input.name.trim(),
          description: input.description?.trim(),
          color: input.color || 'emerald',
          targetAudience: input.targetAudience?.trim(),
        };

        set((state) => ({
          niches: [...state.niches, newNiche],
        }));

        return newNiche;
      },

      deleteNiche: (id) => {
        const nicheToDelete = get().niches.find((n) => n.id === id);
        const nicheName = nicheToDelete?.name;

        set((state) => ({
          niches: state.niches.filter((n) => n.id !== id),
          leads: nicheName
            ? state.leads.map((l) => (l.niche === nicheName ? { ...l, niche: undefined } : l))
            : state.leads,
          selectedNicheFilter:
            state.selectedNicheFilter === nicheName ? 'all' : state.selectedNicheFilter,
        }));
      },

      addLead: (leadInput) => {
        const country = parsePhoneAndDetectCountry(leadInput.phoneRaw);
        const sanitized = sanitizePhoneForWhatsApp(country.e164 || leadInput.phoneRaw);
        const today = getTodayISO();
        const id = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const leadName =
          leadInput.name?.trim() ||
          (leadInput.company?.trim()
            ? `${leadInput.company.trim()} Lead`
            : `Lead ${sanitized ? sanitized.slice(-4) : 'Prospect'}`);

        const newLead: Lead = {
          id,
          name: leadName,
          phoneRaw: leadInput.phoneRaw.trim(),
          phoneSanitized: sanitized,
          isoCode: country.isoCode || 'US',
          countryCode: country.countryCode || '+1',
          countryName: country.countryName || 'United States',
          flagEmoji: country.flagEmoji || '🌐',
          company: leadInput.company?.trim(),
          email: leadInput.email?.trim(),
          website: leadInput.website?.trim(),
          source: leadInput.source || 'Other',
          niche: leadInput.niche?.trim() || 'General',
          currentStage: 0,
          killSwitchStatus: 'active',
          isQueuedForToday: Boolean(leadInput.queueForToday),
          value: leadInput.value || 0,
          tags: leadInput.tags || [],
          createdAt: today,
          updatedAt: today,
        };

        // Create initial cadence stage (Stage 0). If queued for today, scheduledDate is today, else empty (in pool).
        const templates = get().templates;
        const initialScript = getPrefilledMessageForStage(newLead, 0, templates);
        const initialStage: CadenceStage = {
          id: `stg-${id}-0`,
          leadId: id,
          stageNumber: 0,
          title: STAGE_TITLES[0],
          scheduledDate: leadInput.queueForToday ? today : '',
          isSent: false,
          viewStatus: 'unchecked',
          templateScript: initialScript,
        };

        set((state) => ({
          leads: [newLead, ...state.leads],
          stages: [initialStage, ...state.stages],
        }));

        // Fire-and-forget background sync to Supabase
        syncLeadToSupabase(newLead).catch(() => {});

        return newLead;
      },

      addBulkLeads: (leadsInput, defaultNiche, queueCountImmediately) => {
        const today = getTodayISO();
        const templates = get().templates;
        const newLeads: Lead[] = [];
        const newStages: CadenceStage[] = [];
        const queueCount = queueCountImmediately || 0;

        leadsInput.forEach((input, index) => {
          if (!input.name || !input.phoneRaw) return;
          const country = parsePhoneAndDetectCountry(input.phoneRaw);
          const sanitized = sanitizePhoneForWhatsApp(country.e164 || input.phoneRaw);
          const id = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const isQueued = index < queueCount;

          const lead: Lead = {
            id,
            name: input.name.trim(),
            phoneRaw: input.phoneRaw.trim(),
            phoneSanitized: sanitized,
            isoCode: country.isoCode || 'US',
            countryCode: country.countryCode || '+1',
            countryName: country.countryName || 'United States',
            flagEmoji: country.flagEmoji || '🌐',
            company: input.company?.trim(),
            email: input.email?.trim(),
            website: input.website?.trim(),
            source: input.source || 'Other',
            niche: input.niche?.trim() || defaultNiche?.trim() || 'General',
            currentStage: 0,
            killSwitchStatus: 'active',
            isQueuedForToday: isQueued,
            tags: ['Bulk Imported'],
            createdAt: today,
            updatedAt: today,
          };

          const script = getPrefilledMessageForStage(lead, 0, templates);
          const stage: CadenceStage = {
            id: `stg-${id}-0`,
            leadId: id,
            stageNumber: 0,
            title: STAGE_TITLES[0],
            scheduledDate: isQueued ? today : '',
            isSent: false,
            viewStatus: 'unchecked',
            templateScript: script,
          };

          newLeads.push(lead);
          newStages.push(stage);
        });

        set((state) => ({
          leads: [...newLeads, ...state.leads],
          stages: [...newStages, ...state.stages],
        }));

        return newLeads.length;
      },

      autoClassifyAllLeadsNiches: () => {
        let agencyCount = 0;
        let developerCount = 0;
        let updatedCount = 0;

        set((state) => {
          const updatedLeads = state.leads.map((l) => {
            const classified = classifyLeadNiche({
              name: l.name,
              company: l.company,
              website: l.website,
              email: l.email,
            });

            if (classified === 'Website Development Agency') agencyCount++;
            else developerCount++;

            if (l.niche !== classified) updatedCount++;

            return {
              ...l,
              niche: classified,
            };
          });

          return { leads: updatedLeads };
        });

        return { agencyCount, developerCount, updatedCount };
      },

      queueLeadForToday: (leadId) => {
        const today = getTodayISO();
        set((state) => {
          const updatedLeads = state.leads.map((l) =>
            l.id === leadId ? { ...l, isQueuedForToday: true, updatedAt: today } : l
          );

          const updatedStages = state.stages.map((s) => {
            if (s.leadId === leadId && s.stageNumber === 0 && !s.isSent) {
              return { ...s, scheduledDate: today };
            }
            return s;
          });

          return { leads: updatedLeads, stages: updatedStages };
        });
      },

      queueBatchLeadsForToday: (leadIds) => {
        const today = getTodayISO();
        const idSet = new Set(leadIds);
        let count = 0;

        set((state) => {
          const updatedLeads = state.leads.map((l) => {
            if (idSet.has(l.id)) {
              count++;
              return { ...l, isQueuedForToday: true, updatedAt: today };
            }
            return l;
          });

          const updatedStages = state.stages.map((s) => {
            if (idSet.has(s.leadId) && s.stageNumber === 0 && !s.isSent) {
              return { ...s, scheduledDate: today };
            }
            return s;
          });

          return { leads: updatedLeads, stages: updatedStages };
        });

        return count;
      },

      queueFromPool: (count, niche) => {
        const state = get();
        const candidates = state.leads
          .filter((l) => {
            if (l.killSwitchStatus !== 'active' || l.currentStage !== 0 || l.isQueuedForToday) {
              return false;
            }
            if (niche && niche !== 'all' && l.niche !== niche) return false;
            return true;
          })
          .slice(0, count);

        if (candidates.length === 0) return 0;
        return get().queueBatchLeadsForToday(candidates.map((c) => c.id));
      },

      removeFromTodayQueue: (leadId) => {
        set((state) => {
          const updatedLeads = state.leads.map((l) =>
            l.id === leadId ? { ...l, isQueuedForToday: false } : l
          );

          const updatedStages = state.stages.map((s) => {
            if (s.leadId === leadId && s.stageNumber === 0 && !s.isSent) {
              return { ...s, scheduledDate: '' };
            }
            return s;
          });

          return { leads: updatedLeads, stages: updatedStages };
        });
      },

      moveAllUnsentStage0ToPool: () => {
        let movedCount = 0;
        set((state) => {
          const updatedLeads = state.leads.map((l) => {
            if (l.currentStage === 0 && (l.isQueuedForToday || l.isQueuedForToday === undefined)) {
              movedCount++;
              return { ...l, isQueuedForToday: false };
            }
            return l;
          });

          const updatedStages = state.stages.map((s) => {
            if (s.stageNumber === 0 && !s.isSent && s.scheduledDate) {
              return { ...s, scheduledDate: '' };
            }
            return s;
          });

          return { leads: updatedLeads, stages: updatedStages };
        });

        return movedCount;
      },

      updateLead: (id, updates) => {
        const today = getTodayISO();
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === id ? { ...lead, ...updates, updatedAt: today } : lead
          ),
        }));
      },

      deleteLead: (id) => {
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== id),
          stages: state.stages.filter((s) => s.leadId !== id),
          meetings: state.meetings.filter((m) => m.leadId !== id),
          projects: state.projects.filter((p) => p.leadId !== id),
          tasks: state.tasks.filter((t) => t.leadId !== id),
        }));
      },

      setKillSwitch: (leadId, status, reason) => {
        const today = getTodayISO();
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  killSwitchStatus: status,
                  killSwitchReason: reason || lead.killSwitchReason,
                  updatedAt: today,
                }
              : lead
          ),
        }));
      },

      setResponseStatus: (leadId, status) => {
        const today = getTodayISO();
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  responseStatus: status,
                  // If client is interested, optionally keep in mind or mark
                  updatedAt: today,
                }
              : lead
          ),
        }));
      },

      setLeadNote: (leadId, note) => {
        const today = getTodayISO();
        set((state) => ({
          leads: state.leads.map((lead) =>
            lead.id === leadId
              ? {
                  ...lead,
                  notes: note,
                  updatedAt: today,
                }
              : lead
          ),
        }));
      },

      sendAndAutoAdvance: (stageId, customMessage) => {
        const state = get();
        const stage = state.stages.find((s) => s.id === stageId);
        if (!stage) throw new Error('Stage not found');

        const lead = state.leads.find((l) => l.id === stage.leadId);
        if (!lead) throw new Error('Lead not found');

        const messageToSend = customMessage || stage.templateScript;
        const whatsappUrl = buildWhatsAppUrl(lead.phoneSanitized || lead.phoneRaw, messageToSend);

        const now = new Date().toISOString();
        const today = getTodayISO();
        const currentStageNum = stage.stageNumber;

        let nextStageCreated: CadenceStage | undefined;

        if (currentStageNum < 5) {
          const nextStageNum = (currentStageNum + 1) as CadenceStageNumber;
          const intervalDays = CADENCE_INTERVAL_DAYS[currentStageNum] ?? 2;
          const nextScheduledDate = addDays(today, intervalDays);
          const nextScript = getPrefilledMessageForStage(lead, nextStageNum, state.templates);

          const existingNextStage = state.stages.find(
            (st) => st.leadId === lead.id && st.stageNumber === nextStageNum
          );

          let updatedStages: CadenceStage[];

          if (existingNextStage) {
            nextStageCreated = {
              ...existingNextStage,
              scheduledDate: nextScheduledDate,
              isSent: false,
              templateScript: nextScript,
            };
            updatedStages = state.stages.map((st) => {
              if (st.id === stageId) {
                return { ...st, isSent: true, sentDate: now, templateScript: messageToSend };
              }
              if (st.id === existingNextStage.id) {
                return nextStageCreated!;
              }
              return st;
            });
          } else {
            nextStageCreated = {
              id: `stg-${lead.id}-${nextStageNum}`,
              leadId: lead.id,
              stageNumber: nextStageNum,
              title: STAGE_TITLES[nextStageNum],
              scheduledDate: nextScheduledDate,
              isSent: false,
              viewStatus: 'unchecked',
              templateScript: nextScript,
            };
            updatedStages = [
              ...state.stages.map((st) =>
                st.id === stageId
                  ? { ...st, isSent: true, sentDate: now, templateScript: messageToSend }
                  : st
              ),
              nextStageCreated,
            ];
          }

          set((s) => ({
            stages: updatedStages,
            leads: s.leads.map((ld) =>
              ld.id === lead.id
                ? { ...ld, currentStage: nextStageNum, isQueuedForToday: false, updatedAt: today }
                : ld
            ),
          }));
        } else {
          // Stage 5 completed (Breakup)
          set((s) => ({
            stages: s.stages.map((st) =>
              st.id === stageId
                ? { ...st, isSent: true, sentDate: now, templateScript: messageToSend }
                : st
            ),
            leads: s.leads.map((ld) =>
              ld.id === lead.id
                ? { ...ld, killSwitchStatus: 'completed', updatedAt: today }
                : ld
            ),
          }));
        }

        return { whatsappUrl, nextStageCreated };
      },

      markSentAndAdvance: (stageId) => {
        const state = get();
        const stage = state.stages.find((s) => s.id === stageId);
        if (!stage) return;

        const lead = state.leads.find((l) => l.id === stage.leadId);
        if (!lead) return;

        const now = new Date().toISOString();
        const today = getTodayISO();
        const currentStageNum = stage.stageNumber;

        if (currentStageNum < 5) {
          const nextStageNum = (currentStageNum + 1) as CadenceStageNumber;
          const intervalDays = CADENCE_INTERVAL_DAYS[currentStageNum] ?? 2;
          const nextScheduledDate = addDays(today, intervalDays);
          const nextScript = getPrefilledMessageForStage(lead, nextStageNum, state.templates);

          const existingNextStage = state.stages.find(
            (st) => st.leadId === lead.id && st.stageNumber === nextStageNum
          );

          let nextStageCreated: CadenceStage;
          let updatedStages: CadenceStage[];

          if (existingNextStage) {
            nextStageCreated = {
              ...existingNextStage,
              scheduledDate: nextScheduledDate,
              isSent: false,
              templateScript: nextScript,
            };
            updatedStages = state.stages.map((st) => {
              if (st.id === stageId) {
                return { ...st, isSent: true, sentDate: now };
              }
              if (st.id === existingNextStage.id) {
                return nextStageCreated;
              }
              return st;
            });
          } else {
            nextStageCreated = {
              id: `stg-${lead.id}-${nextStageNum}`,
              leadId: lead.id,
              stageNumber: nextStageNum,
              title: STAGE_TITLES[nextStageNum],
              scheduledDate: nextScheduledDate,
              isSent: false,
              viewStatus: 'unchecked',
              templateScript: nextScript,
            };
            updatedStages = [
              ...state.stages.map((st) =>
                st.id === stageId
                  ? { ...st, isSent: true, sentDate: now }
                  : st
              ),
              nextStageCreated,
            ];
          }

          set((s) => ({
            stages: updatedStages,
            leads: s.leads.map((ld) =>
              ld.id === lead.id
                ? { ...ld, currentStage: nextStageNum, isQueuedForToday: false, updatedAt: today }
                : ld
            ),
          }));
        } else {
          // Stage 5 completed (Breakup)
          set((s) => ({
            stages: s.stages.map((st) =>
              st.id === stageId
                ? { ...st, isSent: true, sentDate: now }
                : st
            ),
            leads: s.leads.map((ld) =>
              ld.id === lead.id
                ? { ...ld, killSwitchStatus: 'completed', updatedAt: today }
                : ld
            ),
          }));
        }
      },

      advanceLeadStage: (leadId) => {
        const state = get();
        const lead = state.leads.find((l) => l.id === leadId);
        if (!lead) return;

        // Find active unsent stage for this lead's current stage
        const currentStage =
          state.stages.find(
            (s) => s.leadId === leadId && s.stageNumber === lead.currentStage && !s.isSent
          ) || state.stages.find((s) => s.leadId === leadId && !s.isSent);

        if (currentStage) {
          state.markSentAndAdvance(currentStage.id);
        } else {
          // If no unsent stage found, advance lead and create next stage
          const today = getTodayISO();
          const currentStageNum = lead.currentStage;
          if (currentStageNum < 5) {
            const nextStageNum = (currentStageNum + 1) as CadenceStageNumber;
            const nextScript = getPrefilledMessageForStage(lead, nextStageNum, state.templates);
            const nextStageCreated: CadenceStage = {
              id: `stg-${lead.id}-${nextStageNum}`,
              leadId: lead.id,
              stageNumber: nextStageNum,
              title: STAGE_TITLES[nextStageNum],
              scheduledDate: today,
              isSent: false,
              viewStatus: 'unchecked',
              templateScript: nextScript,
            };

            set((s) => ({
              stages: [...s.stages, nextStageCreated],
              leads: s.leads.map((ld) =>
                ld.id === lead.id
                  ? { ...ld, currentStage: nextStageNum, updatedAt: today }
                  : ld
              ),
            }));
          }
        }
      },

      setStageViewStatus: (stageId, status) => {
        const state = get();
        const stage = state.stages.find((s) => s.id === stageId);
        if (!stage) return;
        const today = getTodayISO();

        if (status === 'replied') {
          // Auto-Cadence Freeze on Reply:
          // 1. Mark stage as replied
          // 2. Set lead as interested, isCadencePaused = true
          // 3. Auto-snooze next upcoming unsent stage for this lead by +7 days
          // 4. Record timestamped note
          const snoozedDate = addDays(today, 7);
          const pauseNote = `[${today}] 💬 Client Replied & Engaged! Cadence auto-paused and snoozed (+7d to ${snoozedDate}) to protect 1-on-1 WhatsApp chat.`;

          set((s) => ({
            stages: s.stages.map((st) => {
              if (st.id === stageId) {
                return { ...st, viewStatus: 'replied' };
              }
              // If there's an unsent stage for this lead, auto-snooze it so it won't trigger generic follow-ups
              if (st.leadId === stage.leadId && !st.isSent) {
                return { ...st, scheduledDate: snoozedDate };
              }
              return st;
            }),
            leads: s.leads.map((ld) => {
              if (ld.id === stage.leadId) {
                const existingNotes = ld.notes ? `${ld.notes}\n${pauseNote}` : pauseNote;
                return {
                  ...ld,
                  responseStatus: 'interested',
                  isCadencePaused: true,
                  cadencePauseReason: 'Client Replied / In Active 1-on-1 Conversation',
                  notes: existingNotes,
                  updatedAt: today,
                };
              }
              return ld;
            }),
          }));
          return;
        }

        // Other statuses (seen, unseen, rejected)
        set((s) => ({
          stages: s.stages.map((st) =>
            st.id === stageId ? { ...st, viewStatus: status } : st
          ),
          leads: s.leads.map((ld) => {
            if (ld.id === stage.leadId) {
              if (status === 'rejected') {
                return { ...ld, responseStatus: 'not_interested', updatedAt: today };
              }
            }
            return ld;
          }),
        }));
      },

      resumeCadence: (leadId) => {
        const today = getTodayISO();
        const resumeNote = `[${today}] ▶️ Cadence Resumed. Restored to today's active outreach queue.`;

        set((s) => ({
          leads: s.leads.map((ld) =>
            ld.id === leadId
              ? {
                  ...ld,
                  isCadencePaused: false,
                  cadencePauseReason: undefined,
                  notes: ld.notes ? `${ld.notes}\n${resumeNote}` : resumeNote,
                  updatedAt: today,
                }
              : ld
          ),
          stages: s.stages.map((st) => {
            if (st.leadId === leadId && !st.isSent) {
              return { ...st, scheduledDate: today };
            }
            return st;
          }),
        }));
      },

      reviveLead: (leadId, customMessage) => {
        const today = getTodayISO();
        const state = get();
        const lead = state.leads.find((l) => l.id === leadId);
        if (!lead) return { whatsappUrl: '' };

        const messageToSend =
          customMessage ||
          interpolateTemplate(WIN_BACK_TEMPLATES[0].content, {
            name: lead.name,
            company: lead.company,
          });

        const revivalNote = `[${today}] ♻️ Lead Revived via 30-Day Win-Back Engine. Reset to Stage 0 with Re-engagement Hook.`;

        // Check if an existing stage 0 exists
        const existingStage0 = state.stages.find(
          (s) => s.leadId === leadId && s.stageNumber === 0
        );

        let updatedStages: CadenceStage[];
        if (existingStage0) {
          updatedStages = state.stages.map((st) => {
            if (st.id === existingStage0.id) {
              return {
                ...st,
                scheduledDate: today,
                sentDate: undefined,
                isSent: false,
                viewStatus: 'unseen' as StageViewStatus,
                templateScript: messageToSend,
              };
            }
            return st;
          });
        } else {
          const newStage0: CadenceStage = {
            id: `stg-${lead.id}-0-revived`,
            leadId: lead.id,
            stageNumber: 0,
            title: 'Initial Outreach (Win-Back)',
            scheduledDate: today,
            isSent: false,
            viewStatus: 'unseen',
            templateScript: messageToSend,
          };
          updatedStages = [newStage0, ...state.stages];
        }

        set((s) => ({
          stages: updatedStages,
          leads: s.leads.map((ld) =>
            ld.id === leadId
              ? {
                  ...ld,
                  killSwitchStatus: 'active',
                  killSwitchReason: undefined,
                  currentStage: 0,
                  isCadencePaused: false,
                  notes: ld.notes ? `${ld.notes}\n${revivalNote}` : revivalNote,
                  updatedAt: today,
                }
              : ld
          ),
        }));

        const whatsappUrl = buildWhatsAppUrl(lead.phoneSanitized, messageToSend);
        return { whatsappUrl };
      },

      updateStage: (stageId, updates) => {
        set((state) => ({
          stages: state.stages.map((st) => (st.id === stageId ? { ...st, ...updates } : st)),
        }));
      },

      addMeeting: (meetingInput) => {
        const id = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newMeeting: Meeting = {
          ...meetingInput,
          id,
          createdAt: new Date().toISOString(),
        };

        // If meeting is created for an active lead, trigger "booked_meeting" kill-switch
        if (meetingInput.leadId) {
          const lead = get().leads.find((l) => l.id === meetingInput.leadId);
          if (lead && lead.killSwitchStatus === 'active') {
            get().setKillSwitch(meetingInput.leadId, 'booked_meeting', `Meeting scheduled on ${meetingInput.meetingDate} at ${meetingInput.startTime}`);
          }
        }

        set((state) => ({
          meetings: [newMeeting, ...state.meetings],
        }));

        return newMeeting;
      },

      updateMeeting: (id, updates) => {
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      setMeetingOutcome: (id, outcome, dealValue, rescheduleNotes) => {
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === id
              ? {
                  ...m,
                  outcome,
                  dealValue: dealValue !== undefined ? dealValue : m.dealValue,
                  rescheduleNotes: rescheduleNotes !== undefined ? rescheduleNotes : m.rescheduleNotes,
                }
              : m
          ),
        }));

        // If Closed Won, optionally prompt or auto-create a project if dealValue > 0
        if (outcome === 'closed_won') {
          const meeting = get().meetings.find((m) => m.id === id);
          if (meeting && (dealValue || meeting.dealValue)) {
            const val = dealValue || meeting.dealValue || 5000;
            const today = getTodayISO();
            const projId = `proj-${Date.now()}`;
            const autoProj: Project = {
              id: projId,
              leadId: meeting.leadId,
              clientName: meeting.leadName,
              projectName: `${meeting.leadName} Delivery`,
              acquisitionDate: today,
              deliveryDeadline: addDays(today, 14),
              totalOrderValue: val,
              paidAmount: Math.round(val * 0.5), // Standard 50% upfront deposit
              remainingBalance: Math.round(val * 0.5),
              status: 'in_progress',
              notes: `Won from meeting on ${meeting.meetingDate}`,
              createdAt: today,
            };
            set((state) => ({
              projects: [autoProj, ...state.projects],
            }));
          }
        }
      },

      deleteMeeting: (id) => {
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
        }));
      },

      addProject: (projectInput) => {
        const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newProject: Project = {
          ...projectInput,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          projects: [newProject, ...state.projects],
        }));

        return newProject;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === id) {
              const updated = { ...p, ...updates };
              // Recalculate remaining balance if total or paid changed
              if (updates.totalOrderValue !== undefined || updates.paidAmount !== undefined) {
                updated.remainingBalance = Math.max(0, updated.totalOrderValue - updated.paidAmount);
              }
              return updated;
            }
            return p;
          }),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },

      addTask: (taskInput) => {
        const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newTask: Task = {
          ...taskInput,
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          tasks: [newTask, ...state.tasks],
        }));

        return newTask;
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      updateTemplate: (id, content) => {
        set((state) => ({
          templates: state.templates.map((tpl) => (tpl.id === id ? { ...tpl, content } : tpl)),
        }));
      },
    }),
    {
      name: 'personal-crm-storage-v2',
      partialize: (state) => ({
        leads: state.leads,
        stages: state.stages,
        meetings: state.meetings,
        projects: state.projects,
        tasks: state.tasks,
        templates: state.templates,
        niches: state.niches,
        dailyGoal: state.dailyGoal,
        streakDays: state.streakDays,
      }),
      merge: (persistedState: any, currentState: CRMState) => {
        const persistedLeads: Lead[] = Array.isArray(persistedState?.leads) ? persistedState.leads : [];
        const hasLegacyDummyData = persistedLeads.some(
          (l) =>
            l.id === 'lead-1' ||
            l.id === 'lead-9' ||
            l.name === 'Kenji Sato' ||
            l.name === 'Chloe Dubois' ||
            l.name === 'Sarah Jenkins' ||
            l.name === 'Elena Rostova'
        );

        if (hasLegacyDummyData) {
          return {
            ...currentState,
            leads: [],
            stages: [],
            meetings: [],
            projects: [],
            tasks: [],
            niches: DEFAULT_NICHES,
          };
        }

        return {
          ...currentState,
          ...persistedState,
          niches:
            Array.isArray(persistedState?.niches) && persistedState.niches.length > 0
              ? persistedState.niches
              : currentState.niches,
        };
      },
    }
  )
);
