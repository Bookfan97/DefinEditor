import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export type ImportStatus = "completed" | "failed" | "importing" | "none";

export interface Project {
    id: string;
    name: string;
    creationTime: number;
    updatedAt: number;
    importStatus: ImportStatus;
}

export const useProjects = () => {
    const [projects, setProjects] = useState<Project[] | undefined>(undefined);

    const fetchProjects = () => {
        invoke<Project[]>("get_projects")
            .then(setProjects)
            .catch(console.error);
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return { projects, refresh: fetchProjects };
};

export const useProjectsPartial = (limit: number) => {
    const { projects } = useProjects();
    return projects?.slice(0, limit);
};

export const useCreateProject = () => {
    return async (args: { name: string }) => {
        try {
            return await invoke<Project>("create_project", { name: args.name });
        } catch (error) {
            console.error("Failed to create project:", error);
            throw error;
        }
    };
};