"use client";
import {ProjectIdView} from "@/features/projects/components/project-id-view.tsx";

export const ProjectIdLayout = ({

                                    projectId,
                                }: {
    children: React.ReactNode;
    projectId: string;
}) => {
    return  <ProjectIdView projectId={projectId} />;
};