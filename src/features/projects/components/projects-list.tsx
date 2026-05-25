
import { FaGithub } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { AlertCircleIcon, ArrowRightIcon, GlobeIcon, Loader2Icon } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

import { Project, useOpenProject, useProjects, useProjectsPartial } from "../hooks/use-projects";

const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) return "Unknown";
    try {
        return formatDistanceToNow(new Date(timestamp), {
            addSuffix: true
        });
    } catch (e) {
        return "Invalid date";
    }
};

const getProjectIcon = (project: Project) => {
    if (project.importStatus === "completed") {
        return <FaGithub className="size-3.5 text-muted-foreground" />
    }

    if (project.importStatus === "failed") {
        return <AlertCircleIcon className="size-3.5 text-muted-foreground" />;
    }

    if (project.importStatus === "importing") {
        return (
            <Loader2Icon className="size-3.5 text-muted-foreground animate-spin" />
        );
    }

    return <GlobeIcon className="size-3.5 text-muted-foreground" />;
}

interface ProjectsListProps {
    onViewAll: () => void;
}

const ContinueCard = ({
                          data,
                          onOpen
                      }: {
    data: Project;
    onOpen: (id: string) => void;
}) => {
    return (
        <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">
        Recently opened
      </span>
            <Button
                variant="outline"
                onClick={() => onOpen(data.id)}
                className="h-auto items-start justify-start p-4 bg-background border rounded-none flex flex-col gap-2"
            >
                <div className="group w-full">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            {getProjectIcon(data)}
                            <span className="font-medium truncate">
                {data.name}
              </span>
                        </div>
                        <ArrowRightIcon className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-xs text-muted-foreground">
            {formatTimestamp(data.lastOpened)}
          </span>
                </div>
            </Button>
        </div>
    )
};

const ProjectItem = ({
                         data,
                         onOpen
                     }: {
    data: Project;
    onOpen: (id: string) => void;
}) => {
    return (
        <button
            onClick={() => onOpen(data.id)}
            className="text-sm text-foreground/60 font-medium hover:text-foreground py-1 flex items-center justify-between w-full group"
        >
            <div className="flex items-center gap-2">
                {getProjectIcon(data)}
                <span className="truncate">{data.name}</span>
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors">
        {formatTimestamp(data.lastOpened)}
      </span>
        </button>
    );
};

export const ProjectsList = ({
                                 onViewAll
                             }: ProjectsListProps) => {
    const { refresh } = useProjects();
    const projects = useProjectsPartial(6);
    const openProject = useOpenProject();

    if (projects === undefined) {
        return <Spinner className="size-4 text-ring" />
    }

    const handleOpen = async (id: string) => {
        try {
            await openProject(id);
            refresh();
            // TODO: Navigate to project editor
            console.log("Project opened:", id);
        } catch (error) {
            console.error("Failed to open project:", error);
        }
    };

    const [mostRecent, ...rest] = projects;

    return (
        <div className="flex flex-col gap-4">
            {mostRecent ? <ContinueCard data={mostRecent} onOpen={handleOpen} /> : null}
            {rest.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Recent projects
            </span>
                        <button
                            onClick={onViewAll}
                            className="flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground transition-colors"
                        >
                            <span>View all</span>
                            <Kbd className="bg-accent border">
                                ⌘K
                            </Kbd>
                        </button>
                    </div>
                    <ul className="flex flex-col">
                        {rest.map((project) => (
                            <ProjectItem
                                key={project.id}
                                data={project}
                                onOpen={handleOpen}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
};