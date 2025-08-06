"use client"

import {useAuth} from "@/contexts/auth-context"
import {Sidebar} from "@/components/sidebar"
import {createContext, useContext, useState} from "react";

interface SidebarContextType {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

export function SidebarProvider({children}: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <SidebarContext.Provider value={{collapsed, setCollapsed}}>
            {children}
        </SidebarContext.Provider>
    );
}

export function SidebarWithContext() {
    const {isAuthenticated, professional, logout} = useAuth();
    const [activeTab, setActiveTab] = useState("dashboard");
    const {collapsed, setCollapsed} = useSidebar();

    if (!isAuthenticated || !professional) {
        return null;
    }

    return (
        <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={logout}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            currentUser={{
                firstName: professional.first_name,
                lastName: professional.last_name,
                email: professional.email,
                department: professional.department_id,
            }}
        />
    );
}