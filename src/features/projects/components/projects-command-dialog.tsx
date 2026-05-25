
import { FaGithub } from "react-icons/fa";
import { AlertCircleIcon, GlobeIcon, Loader2Icon } from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

import { Project, useOpenProject, useProjects } from "../hooks/use-projects";

interface ProjectsCommandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const getProjectIcon = (project: Project) => {
    if (project.importStatus === "completed") {
        return <FaGithub className="size-4 text-muted-foreground" />
    }

    if (project.importStatus === "failed") {
        return <AlertCircleIcon className="size-4 text-muted-foreground" />;
    }

    if (project.importStatus === "importing") {
        return (
            <Loader2Icon className="size-4 text-muted-foreground animate-spin" />
        );
    }

    return <GlobeIcon className="size-4 text-muted-foreground" />;
}

export const ProjectsCommandDialog = ({
                                          open,
                                          onOpenChange,
                                      }: ProjectsCommandDialogProps) => {
    const { projects, refresh } = useProjects();
    const openProject = useOpenProject();

    const handleSelect = async (projectId: string) => {
        try {
            await openProject(projectId);
            refresh();
            // window.location.href = `/projects/${projectId}`;
            console.log("Project opened:", projectId);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to open project:", error);
        }
    };

    return (
        <CommandDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Search Projects"
            description="Search and navigate to your projects"
        >
            <CommandInput placeholder="Search projects..." />
            <CommandList>
                <CommandEmpty>No projects found.</CommandEmpty>
                <CommandGroup heading="Projects">
                    {projects?.map((project) => (
                        <CommandItem
                            key={project.id}
                            value={`${project.name}-${project.id}`}
                            onSelect={() => handleSelect(project.id)}
                        >
                            {getProjectIcon(project)}
                            <span>{project.name}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
};