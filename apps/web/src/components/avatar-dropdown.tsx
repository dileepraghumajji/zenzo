"use client";

import { useRouter } from "next/navigation";
import { User, Bell, LogOut, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@zenzo/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AvatarDropdownProps {
  initials: string;
  avatarUrl?: string | null;
  fullName?: string | null;
  hasClub?: boolean;
  clubSlug?: string | null;
}

export function AvatarDropdown({
  initials,
  avatarUrl,
  fullName,
  hasClub,
  clubSlug,
}: AvatarDropdownProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="size-9 rounded-full overflow-hidden hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="size-9 object-cover" />
          ) : (
            <div className="size-9 rounded-full bg-primary flex items-center justify-center text-caption font-bold text-primary-foreground">
              {initials}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {fullName && (
          <>
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium leading-none">{fullName}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User className="size-4 mr-2" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push("/portal/invites")}>
          <Bell className="size-4 mr-2" />
          Invites
        </DropdownMenuItem>

        {hasClub && clubSlug && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/${clubSlug}/dashboard`)}>
              <LayoutDashboard className="size-4 mr-2" />
              Club Dashboard
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
