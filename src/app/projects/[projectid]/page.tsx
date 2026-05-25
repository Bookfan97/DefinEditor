import { ProjectIdView } from "@/features/projects/components/project-id-view";
const ProjectIdPage = ({
                           projectId,
                       }: {
    projectId: string;
}) => {
    return  <ProjectIdView projectId={projectId} />;
}

export default ProjectIdPage;