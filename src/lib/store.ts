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
} from '@/types/crm';
import { getInitialSeedData, DEFAULT_NICHES } from './seed-data';
import { addDays, CADENCE_INTERVAL_DAYS, getTodayISO, STAGE_TITLES } from './date-utils';
import { buildWhatsAppUrl, getPrefilledMessageForStage } from './whatsapp';
import { parsePhoneAndDetectCountry, sanitizePhoneForWhatsApp } from './phone';
import { syncLeadToSupabase } from './supabase-sync';

interface CRMState {
  leads: Lead[];
  stages: CadenceStage[];
  meetings: Meeting[];
  projects: Project[];
  tasks: Task[];
  templates: CadenceTemplate[];
  niches: Niche[];
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
  setDailyGoal: (goal: number) => void;

  // Niche Actions
  addNiche: (input: { name: string; description?: string; color?: string; targetAudience?: string }) => Niche;
  deleteNiche: (id: string) => void;

  // Lead Actions
  addLead: (leadInput: {
    name: string;
    phoneRaw: string;
    company?: string;
    email?: string;
    source: Lead['source'];
    niche?: string;
    value?: number;
    tags?: string[];
  }) => Lead;
  addBulkLeads: (
    leadsInput: Array<{
      name: string;
      phoneRaw: string;
      company?: string;
      source?: Lead['source'];
      niche?: string;
    }>,
    defaultNiche?: string
  ) => number;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  setKillSwitch: (leadId: string, status: KillSwitchStatus, reason?: string) => void;
  setResponseStatus: (leadId: string, status: LeadResponseStatus) => void;
  setLeadNote: (leadId: string, note: string) => void;

  // Cadence Actions
  sendAndAutoAdvance: (stageId: string, customMessage?: string) => { whatsappUrl: string; nextStageCreated?: CadenceStage };
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
      streakDays: 4,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedNicheFilter: (niche) => set({ selectedNicheFilter: niche }),
      setDailyGoal: (goal) => set({ dailyGoal: Math.max(1, goal) }),

      resetToSampleData: () => {
        set({ ...getInitialSeedData(), searchQuery: '', selectedNicheFilter: 'all', dailyGoal: 20, streakDays: 4 });
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
        set((state) => ({
          niches: state.niches.filter((n) => n.id !== id),
        }));
      },

      addLead: (leadInput) => {
        const country = parsePhoneAndDetectCountry(leadInput.phoneRaw);
        const sanitized = sanitizePhoneForWhatsApp(country.e164 || leadInput.phoneRaw);
        const today = getTodayISO();
        const id = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

        const newLead: Lead = {
          id,
          name: leadInput.name.trim(),
          phoneRaw: leadInput.phoneRaw.trim(),
          phoneSanitized: sanitized,
          isoCode: country.isoCode || 'US',
          countryCode: country.countryCode || '+1',
          countryName: country.countryName || 'United States',
          flagEmoji: country.flagEmoji || '🌐',
          company: leadInput.company?.trim(),
          email: leadInput.email?.trim(),
          source: leadInput.source || 'Other',
          niche: leadInput.niche?.trim() || 'General',
          currentStage: 0,
          killSwitchStatus: 'active',
          value: leadInput.value || 0,
          tags: leadInput.tags || [],
          createdAt: today,
          updatedAt: today,
        };

        // Create initial cadence stage (Stage 0) due today
        const templates = get().templates;
        const initialScript = getPrefilledMessageForStage(newLead, 0, templates);
        const initialStage: CadenceStage = {
          id: `stg-${id}-0`,
          leadId: id,
          stageNumber: 0,
          title: STAGE_TITLES[0],
          scheduledDate: today,
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

      addBulkLeads: (leadsInput, defaultNiche) => {
        const today = getTodayISO();
        const templates = get().templates;
        const newLeads: Lead[] = [];
        const newStages: CadenceStage[] = [];

        for (const input of leadsInput) {
          if (!input.name || !input.phoneRaw) continue;
          const country = parsePhoneAndDetectCountry(input.phoneRaw);
          const sanitized = sanitizePhoneForWhatsApp(country.e164 || input.phoneRaw);
          const id = `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

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
            source: input.source || 'Other',
            niche: input.niche?.trim() || defaultNiche?.trim() || 'General',
            currentStage: 0,
            killSwitchStatus: 'active',
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
            scheduledDate: today,
            isSent: false,
            viewStatus: 'unchecked',
            templateScript: script,
          };

          newLeads.push(lead);
          newStages.push(stage);
        }

        set((state) => ({
          leads: [...newLeads, ...state.leads],
          stages: [...newStages, ...state.stages],
        }));

        return newLeads.length;
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
          const intervalDays = CADENCE_INTERVAL_DAYS[currentStageNum];
          const nextScheduledDate = addDays(today, intervalDays);

          const nextScript = getPrefilledMessageForStage(lead, nextStageNum, state.templates);
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

          set((s) => ({
            stages: [
              ...s.stages.map((st) =>
                st.id === stageId
                  ? { ...st, isSent: true, sentDate: now, templateScript: messageToSend }
                  : st
              ),
              nextStageCreated!,
            ],
            leads: s.leads.map((ld) =>
              ld.id === lead.id
                ? { ...ld, currentStage: nextStageNum, updatedAt: today }
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
      name: 'personal-crm-storage-v1',
      partialize: (state) => ({
        leads: state.leads,
        stages: state.stages,
        meetings: state.meetings,
        projects: state.projects,
        tasks: state.tasks,
        templates: state.templates,
      }),
    }
  )
);
