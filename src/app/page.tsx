'use client';

import React, { useState, useRef, Suspense } from 'react';
import { useCRMStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';

// Authentication & Users
import { LoginPage } from '@/components/auth/LoginPage';
import { UserManagementModal } from '@/components/auth/UserManagementModal';

// Views
import { TodaysWorkView } from '@/components/views/TodaysWorkView';
import { LeadsPipelineView } from '@/components/views/LeadsPipelineView';
import { NichesView } from '@/components/views/NichesView';
import { MeetingsView } from '@/components/views/MeetingsView';
import { ProjectsFinancialView } from '@/components/views/ProjectsFinancialView';
import { AnalyticsView } from '@/components/views/AnalyticsView';

// Modals
import { NewLeadModal } from '@/components/modals/NewLeadModal';
import { BulkImportModal } from '@/components/modals/BulkImportModal';
import { NewNicheModal } from '@/components/modals/NewNicheModal';
import { MeetingModal } from '@/components/modals/MeetingModal';
import { OutcomeModal } from '@/components/modals/OutcomeModal';
import { ProjectModal } from '@/components/modals/ProjectModal';
import { TaskModal } from '@/components/modals/TaskModal';
import { TemplateEditorModal } from '@/components/modals/TemplateEditorModal';
import { Meeting, Project } from '@/types/crm';

function CRMContent() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeTab = useCRMStore((s) => s.activeTab);

  // Modal States
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [nicheForNewLead, setNicheForNewLead] = useState<string | undefined>(undefined);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isNewNicheOpen, setIsNewNicheOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingPrefillLeadId, setMeetingPrefillLeadId] = useState<string | undefined>(undefined);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | undefined>(undefined);

  const [outcomeMeeting, setOutcomeMeeting] = useState<Meeting | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Hook keyboard shortcuts (1-5, N, B, /)
  useKeyboardShortcuts({
    onOpenNewLead: () => {
      setNicheForNewLead(undefined);
      setIsNewLeadOpen(true);
    },
    onOpenBulkImport: () => setIsBulkImportOpen(true),
    onFocusSearch: () => {
      searchInputRef.current?.focus();
    },
  });

  // If not logged in, enforce authentication gateway
  if (!currentUser) {
    return <LoginPage />;
  }

  const handleScheduleMeetingForLead = (leadId: string) => {
    setMeetingPrefillLeadId(leadId);
    setEditingMeeting(undefined);
    setIsMeetingModalOpen(true);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setMeetingPrefillLeadId(undefined);
    setIsMeetingModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleOpenNewLeadWithNiche = (nicheName: string) => {
    setNicheForNewLead(nicheName);
    setIsNewLeadOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Universal App Header */}
      <AppHeader
        onOpenNewLead={() => {
          setNicheForNewLead(undefined);
          setIsNewLeadOpen(true);
        }}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        searchInputRef={searchInputRef}
      />

      {/* Main Layout Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
        />

        {/* Dynamic Main Workspace View */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 pb-28 lg:pb-12 bg-zinc-950">
          {activeTab === 'today' && (
            <TodaysWorkView
              onScheduleMeetingForLead={handleScheduleMeetingForLead}
              onOpenMeetingOutcome={(m) => setOutcomeMeeting(m)}
              onOpenNewTask={() => setIsTaskModalOpen(true)}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsPipelineView
              onScheduleMeeting={handleScheduleMeetingForLead}
              onOpenNewLead={() => {
                setNicheForNewLead(undefined);
                setIsNewLeadOpen(true);
              }}
            />
          )}

          {activeTab === 'niches' && (
            <NichesView
              onOpenNewNiche={() => setIsNewNicheOpen(true)}
              onOpenNewLeadWithNiche={handleOpenNewLeadWithNiche}
            />
          )}

          {activeTab === 'meetings' && (
            <MeetingsView
              onOpenNewMeeting={() => {
                setEditingMeeting(undefined);
                setMeetingPrefillLeadId(undefined);
                setIsMeetingModalOpen(true);
              }}
              onOpenOutcome={(m) => setOutcomeMeeting(m)}
              onEditMeeting={handleEditMeeting}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsFinancialView
              onOpenNewProject={() => {
                setEditingProject(undefined);
                setIsProjectModalOpen(true);
              }}
              onEditProject={handleEditProject}
              onOpenNewTask={() => setIsTaskModalOpen(true)}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <BottomNav />

      {/* Modals */}
      <NewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => {
          setIsNewLeadOpen(false);
          setNicheForNewLead(undefined);
        }}
        initialNiche={nicheForNewLead}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      <NewNicheModal
        isOpen={isNewNicheOpen}
        onClose={() => setIsNewNicheOpen(false)}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />

      <MeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        prefillLeadId={meetingPrefillLeadId}
        existingMeeting={editingMeeting}
      />

      <OutcomeModal
        isOpen={Boolean(outcomeMeeting)}
        onClose={() => setOutcomeMeeting(null)}
        meeting={outcomeMeeting}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        existingProject={editingProject}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      <TemplateEditorModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
      />
    </div>
  );
}

export default function CRMAppPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Initializing Nexus CRM Engine...
          </span>
        </div>
      }
    >
      <CRMContent />
    </Suspense>
  );
}
