"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { USState, DEFAULT_STATE, getStateByCode } from '@/lib/states';

interface StateContextType {
    selectedState: USState;
    setSelectedState: (state: USState) => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

const STATE_STORAGE_KEY = "jtube_selected_state";

export function StateProvider({ children }: { children: ReactNode }) {
    const [selectedState, setSelectedState] = useState<USState>(DEFAULT_STATE);

    // Load saved state from localStorage on mount
    useEffect(() => {
        const savedCode = localStorage.getItem(STATE_STORAGE_KEY);
        if (savedCode) {
            const state = getStateByCode(savedCode);
            if (state) {
                setTimeout(() => setSelectedState(state), 0);
            }
        }
    }, []);

    // Save state to localStorage when it changes
    const handleSetState = (state: USState) => {
        setSelectedState(state);
        localStorage.setItem(STATE_STORAGE_KEY, state.code);
    };

    return (
        <StateContext.Provider value={{ selectedState, setSelectedState: handleSetState }}>
            {children}
        </StateContext.Provider>
    );
}

export function useStateFilter() {
    const context = useContext(StateContext);
    if (context === undefined) {
        throw new Error('useStateFilter must be used within a StateProvider');
    }
    return context;
}
