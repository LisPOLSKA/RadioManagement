"use client";

import React from 'react'
import { Button } from './ui/button'
import { useTranslations } from 'next-intl';
import { useAuthActions } from '@convex-dev/auth/react';

const SignOutButton = () => {
    const t = useTranslations("Main");
    const { signOut } = useAuthActions();
    return (
        <Button variant="secondary" size="sm" onClick={()=>{signOut(); window.location.reload();}}>
            {t("logout")}
        </Button>
    )
}

export default SignOutButton