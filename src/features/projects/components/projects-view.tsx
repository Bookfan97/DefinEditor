"use client";

import { SparkleIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import {
    adjectives,
    animals,
    colors,
    uniqueNamesGenerator,
} from "unique-names-generator";
import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

import { ProjectsList } from "./projects-list";
import { useCreateProject, useImportProject, useOpenProject, useProjects } from "../hooks/use-projects";
import { ProjectsCommandDialog } from "./projects-command-dialog";
import { ModeToggle } from "@/components/mode-toggle";

const font = { className: "" };

export const ProjectsView = () => {
    const { refresh } = useProjects();
    const createProject = useCreateProject();
    const importProject = useImportProject();
    const openProject = useOpenProject();

    const [commandDialogOpen, setCommandDialogOpen] = useState(false);

    const handleOpenFolder = async () => {
        const selected = await open({
            directory: true,
            multiple: false,
        });

        if (selected && typeof selected === "string") {
            try {
                const project = await importProject(selected);
                await openProject(project.id);
                refresh();
            } catch (error) {
                console.error("Failed to open folder:", error);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === "k") {
                    e.preventDefault();
                    setCommandDialogOpen(true);
                }
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <>
            <ProjectsCommandDialog
                open={commandDialogOpen}
                onOpenChange={setCommandDialogOpen}
            />
            <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-6 md:p-16">
                <div className="w-full max-w-sm mx-auto flex flex-col gap-4 items-center">

                    <div className="flex justify-between gap-4 w-full items-center">

                        <div className="flex items-center gap-2 w-full group/logo">
                            <img src="/logo.svg" alt="Polaris" className="size-[32px] md:size-[46px]" />
                            <h1 className={cn(
                                "text-4xl md:text-5xl font-semibold",
                                font.className,
                            )}>
                                DefinEditor
                            </h1>
                        </div>

                        <ModeToggle />
                    </div>

                    <div className="flex flex-col gap-4 w-full">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const projectName = uniqueNamesGenerator({
                                        dictionaries: [
                                            adjectives,
                                            animals,
                                            colors,
                                        ],
                                        separator: "-",
                                        length: 3,
                                    });

                                    createProject({
                                        name: projectName,
                                    }).then(() => {
                                        refresh();
                                    });
                                }}
                                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <SparkleIcon className="size-4" />
                                    <Kbd className="bg-accent border">
                                        ⌘J
                                    </Kbd>
                                </div>
                                <div>
                  <span className="text-sm">
                    New
                  </span>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleOpenFolder}
                                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
                            >
                                <div className="flex items-center justify-between w-full">
                                    <FaGithub className="size-4" />
                                    <Kbd className="bg-accent border">
                                        ⌘K
                                    </Kbd>
                                </div>
                                <div>
                  <span className="text-sm">
                    Open
                  </span>
                                </div>
                            </Button>
                        </div>

                        <ProjectsList onViewAll={() => setCommandDialogOpen(true)} />

                    </div>

                </div>
            </div>
        </>
    );
};