"use client";

import { Navbar } from "./navbar";

export const ProjectIdLayout = ({
                                    children,
                                    projectId,
                                }: {
    children: React.ReactNode;
    projectId: string;
}) => {
    return (
        <div className="w-full h-screen flex flex-col">
            <Navbar projectId={projectId} />
            <div className="flex-1 flex overflow-hidden">
                <div className="w-[400px] border-r bg-sidebar p-4 overflow-y-auto hidden md:block">
                    <div>Conversation Sidebar</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};