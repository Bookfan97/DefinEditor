import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export type ImportStatus = "completed" | "failed" | "importing" | "none";

export interface Project {
    id: string;
    name: string;
    path?: string;
    creationTime: number;
    updatedAt: number;
    lastOpened: number;
    importStatus: ImportStatus;
}

export const useProjects = () => {
    const [projects, setProjects] = useState<Project[] | undefined>(undefined);

    const fetchProjects = () => {
        invoke<Project[]>("get_projects")
            .then((data) => {
                // Sort by lastOpened descending
                const sorted = [...data].sort((a, b) => b.lastOpened - a.lastOpened);
                setProjects(sorted);
            })
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

export const useImportProject = () => {
    return async (path: string) => {
        try {
            return await invoke<Project>("import_project", { pathStr: path });
        } catch (error) {
            console.error("Failed to import project:", error);
            throw error;
        }
    };
};

export const useOpenProject = () => {
    return async (id: string) => {
        try {
            return await invoke<Project>("open_project", { id });
        } catch (error) {
            console.error("Failed to open project:", error);
            throw error;
        }
    };
};