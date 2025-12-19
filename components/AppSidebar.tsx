import React from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Radio } from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import { UserButton } from '@clerk/nextjs';

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const t = await getTranslations('Main');

    const data  = {
        navMain: [
            {
                title: t('songs'),
                url: "/songs",
            },
            {
                title: t('playlists'),
                url: "/playlists",
                items: [
                    {
                        title: t('playlists'),
                        url: "/playlists",
                    },
                    {
                        title: t('selectedPlaylist'),
                        url: "/selectedPlaylist",
                    },
                ]
            },
            {
                title: t('schedules'),
                url: "/schedules",
                items: [
                    {
                        title: t('schedules'),
                        url: "/schedules",
                    },
                    {
                        title: t('selectedSchedule'),
                        url: "/selectedSchedule",
                    },
                ]
            },
            {
                title: t('exceptions'),
                url: "/exceptions",
            },
            {
                title: t('admin'),
                url: "/users",
                items: [
                    {
                        title: t('users'),
                        url: "/users",
                    },
                    {
                        title: t('logs'),
                        url: "/logs",
                    }
                ]
            }
        ]
    }


    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div>
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Radio className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-medium">{t('title')}</span>
                                    <span className="">v1.0.0</span>
                                </div>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {data.navMain.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <a href={item.url} className='font-medium'>
                                        {item.title}
                                    </a>
                                </SidebarMenuButton>
                                {item.items?.length ? (
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild isActive={false}>
                                                    <a href={subItem.url}>{subItem.title}</a>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                ) : null}
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="flex justify-center items-end p-4">
                <div className="w-full flex justify-center">
                    <UserButton
                        showName
                        appearance={{
                            variables: {
                                colorPrimary: "#4f46e5",        // Twój główny kolor
                                colorText: "#ffffff",
                                colorBackground: "#999",     // tło avatara / przycisku
                                colorTextSecondary: "#e0e7ff",
                            },
                            elements: {
                                userButtonAvatarBox: "h-10 w-10 rounded-full border border-white",
                                userButtonBox: "flex !flex-row-reverse items-center !gap-3 px-3 py-2 rounded-lg hover:bg-indigo-600 transition",
                                userButtonName: "text-sm font-medium",
                            },
                            layout: {logoPlacement: "inside"}
                        }}
                    />
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

export default AppSidebar