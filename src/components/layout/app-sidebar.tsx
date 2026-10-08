"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  FolderOpen,
  ChevronRight,
  Eye,
  Map,
  BookOpen,
  FileText,
  Presentation,
  Shield,
  PlusIcon,
} from "lucide-react";
import { Collapsible } from "radix-ui";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AddRepoDialog } from "@/components/layout/add-repo-dialog";
import { UserMenu } from "@/components/layout/user-menu";
import type { RepoConfig } from "@/lib/types";

interface AppSidebarProps {
  repos: RepoConfig[];
  showAdmin?: boolean;
  localFsEnabled?: boolean;
  githubEnabled?: boolean;
}

const projectTabs = [
  { label: "Overview", segment: "", icon: Eye },
  { label: "Epics", segment: "epics", icon: Map },
  { label: "Stories", segment: "stories", icon: BookOpen },
  { label: "Library", segment: "docs", icon: FileText },
  { label: "Status Report", segment: "status-report", icon: Presentation },
];

export function AppSidebar({ repos, showAdmin, localFsEnabled, githubEnabled }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Track which repo key is expanded — only one at a time
  const activeRepoKey = useMemo(
    () => repos.find((r) => pathname.startsWith(`/repo/${r.owner}/${r.name}`)),
    [repos, pathname]
  );
  const derivedOpenRepo = activeRepoKey
    ? `${activeRepoKey.owner}/${activeRepoKey.name}`
    : null;
  const [openRepo, setOpenRepo] = useState<string | null>(derivedOpenRepo);

  // Sync with route changes (e.g. navigating via links outside sidebar)
  if (derivedOpenRepo && derivedOpenRepo !== openRepo) {
    setOpenRepo(derivedOpenRepo);
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:px-2">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/equifax-logo.svg"
            alt="Equifax"
            width={106}
            height={24}
            className="h-6 w-auto shrink-0 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:object-cover group-data-[collapsible=icon]:object-left"
          />
          <span className="border-l border-sidebar-border pl-3 text-sm font-semibold tracking-wide group-data-[collapsible=icon]:hidden">
            MyBMAD
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Dashboard">
                  <Link href="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-[0.12em]">
            Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {repos.map((repo) => {
                const basePath = `/repo/${repo.owner}/${repo.name}`;
                const isRepoActive = pathname.startsWith(basePath);

                const repoKey = `${repo.owner}/${repo.name}`;

                return (
                  <Collapsible.Root
                    key={repoKey}
                    open={openRepo === repoKey}
                    onOpenChange={(open) => {
                      setOpenRepo(open ? repoKey : null);
                      if (open && !isRepoActive) {
                        router.push(basePath);
                      }
                    }}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <Collapsible.Trigger asChild>
                        <SidebarMenuButton isActive={isRepoActive} tooltip={repo.displayName}>
                          {repo.sourceType === "local" ? (
                            <FolderOpen className="h-4 w-4" />
                          ) : (
                            <FolderGit2 className="h-4 w-4" />
                          )}
                          <span>{repo.displayName}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </Collapsible.Trigger>
                      <Collapsible.Content className="group-data-[collapsible=icon]:hidden">
                        <SidebarMenuSub>
                          {projectTabs.map((tab) => {
                            const tabHref = tab.segment
                              ? `${basePath}/${tab.segment}`
                              : basePath;
                            const isTabActive = tab.segment === ""
                              ? pathname === basePath || pathname === basePath + "/"
                              : pathname.startsWith(`${basePath}/${tab.segment}`);

                            return (
                              <SidebarMenuSubItem key={tab.segment || "overview"}>
                                <SidebarMenuSubButton asChild isActive={isTabActive}>
                                  <Link
                                    href={tabHref}
                                    onClick={() => {
                                      if (isTabActive) {
                                        window.dispatchEvent(new CustomEvent("section-reset"));
                                      }
                                    }}
                                  >
                                    <tab.icon className="h-3.5 w-3.5" />
                                    <span>{tab.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </Collapsible.Content>
                    </SidebarMenuItem>
                  </Collapsible.Root>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-2 px-1 pb-2 group-data-[collapsible=icon]:hidden">
          <AddRepoDialog
            importedRepos={repos}
            localFsEnabled={localFsEnabled}
            githubEnabled={githubEnabled}
            trigger={
              <Button variant="outline" size="lg" className="w-full">
                <PlusIcon aria-hidden="true" />
                Add New Project
              </Button>
            }
          />
          {showAdmin && (
            <Button variant="outline" size="lg" className="w-full" asChild>
              <Link href="/admin">
                <Shield className="h-4 w-4" aria-hidden="true" />
                Admin
              </Link>
            </Button>
          )}
        </div>
        <div className="border-t border-border/50 pt-2">
          <UserMenu />
        </div>
        <div className="border-t border-border/50 pt-2 pb-1 text-center group-data-[collapsible=icon]:hidden">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Delivery Intelligence
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
