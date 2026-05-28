"use client";

import React from 'react'
import { Button } from './ui/button'
import { useTranslations } from 'next-intl';
import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'next/navigation';

const SignOutButton = () => {
    const t = useTranslations("Main");
    const { signOut } = useAuthActions();
    const router = useRouter();
    return (
        <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
                await signOut();
                router.replace('/sign-in');
            }}
        >
            {t("logout")}
        </Button>
    )
}

export default SignOutButton