"use client"

import React from 'react'
import { api } from '@/convex/_generated/api';
import { useConvexAuth, useQuery } from 'convex/react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import SignOutButton from '@/components/SignOutButton';

const AuthorizationProvider = ({children}: {children: React.ReactNode}) => {
    const t = useTranslations("Main");
    const { isLoading, isAuthenticated } = useConvexAuth();
    const user = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
    const pathname = usePathname();
    const router = useRouter();
    if(pathname === "/sign-in"){
        return children;
    }
    if(!isLoading && !isAuthenticated){
        router.replace("/sign-in");
    }
    if (!isLoading && (!isAuthenticated || user === null || (user?.role !== undefined && user.role <= 0))){
        console.log(user === null, !isAuthenticated, isLoading, (!isAuthenticated || (user?.role !== undefined && user.role <= 0)) && !isLoading);
        return (
            <div className='w-screen h-screen flex items-center justify-center flex-col gap-4'>
                <h1 className='text-red-500 text-6xl'>{t("unauthorized")}</h1>
                <SignOutButton />
            </div>
        )
    }

    if(isLoading){
        return (
            <div className='w-screen h-screen flex items-center justify-center'>
                <h1 className='text-6xl'>{t("loading")}</h1>
            </div>
        )
    }

    return children;
}

export default AuthorizationProvider