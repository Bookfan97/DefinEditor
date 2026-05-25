"use client";

import { useState } from "react";
import { Cloud, LoaderIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useProject, useRenameProject } from "../hooks/use-projects";

export const Navbar = ({
                           projectId
                       }: {
    projectId: string;
}) => {
    const project = useProject(projectId);
    const renameProject = useRenameProject();

    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState("");

    const handleStartRename = () => {
        if (!project) return;
        setName(project.name);
        setIsRenaming(true);
    };

    const handleSubmit = async () => {
        if (!project) return;
        setIsRenaming(false);

        const trimmedName = name.trim();
        if (!trimmedName || trimmedName === project.name) return;

        try {
            await renameProject({ id: projectId, name: trimmedName });
        } catch (error) {
            console.error(error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();
        } else if (e.key === "Escape") {
            setIsRenaming(false);
        }
    };

    return (
        <nav className="flex justify-between items-center gap-x-2 p-2 bg-sidebar border-b">
            <div className="flex items-center gap-x-2">
                <Breadcrumb>
                    <BreadcrumbList className="gap-0!">
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                className="flex items-center gap-1.5"
                                asChild
                            >
                                <Button
                                    variant="ghost"
                                    className="w-fit! p-1.5! h-7!"
                                    onClick={() => {
                                        window.history.pushState({}, "", "/");
                                        window.dispatchEvent(new Event("pushstate"));
                                    }}
                                >
                                    <img
                                        src="/logo.svg"
                                        alt="Logo"
                                        width={20}
                                        height={20}
                                    />
                                    <span
                                        className={cn(
                                            "text-sm font-medium",
                                        )}
                                    >
                      DefinEditor
                    </span>
                                </Button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="ml-0! mr-1" />
                        <BreadcrumbItem>
                            {isRenaming ? (
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onBlur={handleSubmit}
                                    onKeyDown={handleKeyDown}
                                    className="text-sm bg-transparent text-foreground outline-none focus:ring-1 focus:ring-inset focus:ring-ring font-medium max-w-40 truncate"
                                />
                            ) : (
                                <BreadcrumbPage
                                    onClick={handleStartRename}
                                    className="text-sm cursor-pointer hover:text-primary font-medium max-w-40 truncate"
                                >
                                    {project?.name ?? "Loading..."}
                                </BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {project?.importStatus === "importing" ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <LoaderIcon className="size-4 text-muted-foreground animate-spin" />
                        </TooltipTrigger>
                        <TooltipContent>Importing...</TooltipContent>
                    </Tooltip>
                ) : (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Cloud className="size-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                            Saved{" "}
                            {project?.updatedAt
                                ? formatDistanceToNow(
                                    project.updatedAt,
                                    { addSuffix: true, }
                                )
                                : "Loading..."}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            <div className="flex items-center gap-2">
                {/* UserButton removed */}
            </div>
        </nav>
    )
};