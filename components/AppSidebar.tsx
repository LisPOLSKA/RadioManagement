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
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { Button } from './ui/button';
import SignOutButton from './SignOutButton';

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const t = await getTranslations('Main');

    let isAdmin = false;
    let isSupervisor = false;

    const token = await convexAuthNextjsToken();

    const user = await fetchQuery(api.users.getCurrentUser, {}, {token: token});

    isAdmin = !!user && user.role >= 3;
    isSupervisor = !!user && user.role >= 2;

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
            }
        ]
    }

    const supervisorData = {
        navMain: [
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
        ]
    }

    const adminData = {
        navMain: [
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
                    },
                    {
                        title: t('checkSchedule'),
                        url: "/checkSchedule",
                    },
                    {
                        title: t('devices'),
                        url: "/devices",
                    }
                ]
            }
        ]
    };

    const lastItems = {
        navMain: [
            {
                title: t('tutorials'),
                url: "/tutorials",
            }
        ]
    }


    return (
        <Sidebar collapsible='icon' {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href='/'>
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Radio className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-medium">{t('title')}</span>
                                    <span className="">v1.0.0</span>
                                </div>
                            </Link>
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
                        {isSupervisor && supervisorData.navMain.map((item) => (
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
                        {isAdmin && adminData.navMain.map((item) => (
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
                        {lastItems.navMain.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild>
                                    <a href={item.url} className='font-medium'>
                                        {item.title}
                                    </a>
                                </SidebarMenuButton>
                                {/* {item.items?.length ? (
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild isActive={false}>
                                                    <a href={subItem.url}>{subItem.title}</a>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                ) : null} */}
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="flex justify-center items-end p-4">
                <div className="w-full flex justify-center flex-col items-center">
                    <SignOutButton />
                    <div className='bg-muted-foreground w-full h-[0.1] mt-1'></div>
                    <div>
                        <a href="https://yolo-services.pl/" className='text-xs text-muted-foreground'>© YoloServices 2026</a>
                    </div>
                </div>
            </SidebarFooter>
            <SidebarRail className="hidden md:flex" />
        </Sidebar>
    )
}

export default AppSidebar