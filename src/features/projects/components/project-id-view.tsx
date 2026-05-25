import { ProjectIdLayout } from "./project-id-layout";

export const ProjectIdView = ({ projectId }: { projectId: string }) => {
    return (
        <ProjectIdLayout projectId={projectId}>
            <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                    Select a file or conversation to get started
                </p>
            </div>
        </ProjectIdLayout>
    );
};
