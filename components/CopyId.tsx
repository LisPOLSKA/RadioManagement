import React from 'react'
import { Button } from './ui/button';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DropdownMenuItem } from './ui/dropdown-menu';

type Props = {
    id: string;
    isMenuItem?: boolean;
}

const CopyId = ({id, isMenuItem}: Props) => {
    const t = useTranslations("UI");

    function copyId(id: string) {
        navigator.clipboard.writeText(id);
        toast.success(t("userIdCopied"));
    }

    if(isMenuItem) {
        return (
            <DropdownMenuItem onClick={() => copyId(id)}>
                {t("copyId")}
            </DropdownMenuItem>
        )
    }

    return (
        <Button variant="ghost" size="sm" onClick={() => copyId(id)}>{t("copyId")}</Button>
    )
}

export default CopyId