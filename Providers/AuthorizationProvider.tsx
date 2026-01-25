"use client"

import React from 'react'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useTranslations } from 'next-intl';

const AuthorizationProvider = ({children}: {children: React.ReactNode}) => {
    const t = useTranslations("Main");
    const { isSignedIn, userId, isLoaded } = useAuth();
    const user = useQuery(api.users.getUser, userId ? {clerkId: userId} : "skip");
    if (isLoaded && (!isSignedIn || !userId || user === null || (user?.role !== undefined && user.role <= 0))){
        console.log("redirecting to sign in");
        console.log(user === null, !isSignedIn, !userId, userId, isLoaded, (!isSignedIn || !userId || (user?.role !== undefined && user.role <= 0)) && isLoaded);
        return (
            <div className='w-screen h-screen flex items-center justify-center'>
                <h1 className='text-red-500 text-6xl'>{t("unauthorized")}</h1>
            </div>
        )
    }

    if(!isLoaded){
        return (
            <div className='w-screen h-screen flex items-center justify-center'>
                <h1 className='text-6xl'>{t("loading")}</h1>
            </div>
        )
    }

    return children;
}

export default AuthorizationProvider