// /u/[username] — public member profile
// No auth required.

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createServiceClient } from "@zenzo/database/client";
import { INTEREST_CATEGORIES, ClubCategory } from "@zenzo/database/enums";

const CATEGORY_LABELS: Record<string, string> = {
  [ClubCategory.Gym]:         "Gym",
  [ClubCategory.MartialArts]: "Martial Arts",
  [ClubCategory.Dance]:       "Dance",
  [ClubCategory.Yoga]:        "Yoga",
  [ClubCategory.Other]:       "Other",
};

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("full_name, username")
    .eq("username", params.username)
    .maybeSingle();

  if (!data) return { title: "Profile | Zenzo" };

  return {
    title: `${data.full_name} (@${data.username}) | Zenzo`,
    openGraph: {
      title: `${data.full_name} (@${data.username}) | Zenzo`,
      description: `View ${data.full_name}'s fitness profile on Zenzo`,
    },
  };
}

function InitialsAvatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={
        size === "lg"
          ? "size-20 rounded-full bg-primary flex items-center justify-center text-h2 font-bold text-primary-foreground"
          : "size-10 rounded-full bg-primary-subtle flex items-center justify-center text-body font-bold text-brand"
      }
    >
      {initials}
    </div>
  );
}

export default async function PublicMemberProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createServiceClient();

  const { data: member } = await supabase
    .from("users")
    .select("id, full_name, username, bio, avatar_url, city, created_at")
    .eq("username", params.username)
    .maybeSingle();

  if (!member) notFound();

  const [{ data: interests }, { data: memberships }, { count: attendanceCount }, { data: achievementRows }] =
    await Promise.all([
      supabase
        .from("user_interests")
        .select("slug")
        .eq("user_id", member.id),
      supabase
        .from("club_memberships")
        .select("club_id, status, joined_at")
        .eq("user_id", member.id)
        .in("status", ["active", "overdue"])
        .limit(10),
      supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq("membership_id", member.id)
        .eq("status", "present"),
      supabase
        .from("member_achievements")
        .select("id, title, description, badge_icon, awarded_at, club_id")
        .eq("user_id", member.id)
        .order("awarded_at", { ascending: false }),
    ]);

  const clubIds = (memberships ?? []).map((m) => m.club_id);
  const achievementClubIds = [...new Set((achievementRows ?? []).map((a) => a.club_id))];
  const allClubIds = [...new Set([...clubIds, ...achievementClubIds])];

  let clubs: { id: string; name: string; slug: string; business_type: string }[] = [];
  if (allClubIds.length > 0) {
    const { data } = await supabase
      .from("clubs")
      .select("id, name, slug, business_type")
      .in("id", allClubIds);
    clubs = data ?? [];
  }

  const clubMap = Object.fromEntries(clubs.map((c) => [c.id, c]));
  const memberClubs = clubs.filter((c) => clubIds.includes(c.id));

  const achievements = (achievementRows ?? []).map((a) => ({
    id:          a.id,
    title:       a.title,
    description: a.description,
    badgeIcon:   a.badge_icon,
    awardedAt:   a.awarded_at,
    clubName:    clubMap[a.club_id]?.name ?? null,
    clubSlug:    clubMap[a.club_id]?.slug ?? null,
  }));

  const memberSince = new Date(member.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const interestCategories = INTEREST_CATEGORIES.filter((c) =>
    (interests ?? []).some((i) => i.slug === c.slug)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface-raised">
        <div className="max-w-lg mx-auto px-4 py-3">
          <Link href="/discover" className="text-caption text-muted hover:text-brand transition-colors">
            ← Explore
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          {member.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatar_url}
              alt={member.full_name}
              className="size-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <InitialsAvatar name={member.full_name} size="lg" />
          )}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-h2 font-bold text-heading truncate">{member.full_name}</h1>
            {member.username && (
              <p className="text-body text-muted">@{member.username}</p>
            )}
            <p className="text-caption text-muted mt-1">Member since {memberSince}</p>
          </div>
        </div>

        {/* Bio */}
        {member.bio && (
          <p className="text-body text-muted">{member.bio}</p>
        )}

        {/* Interests */}
        {interestCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-label text-muted uppercase tracking-wider">Into</p>
            <div className="flex flex-wrap gap-2">
              {interestCategories.map((cat) => (
                <span
                  key={cat.slug}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cat.color}`}
                >
                  {cat.icon} {cat.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-surface-raised border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-body text-muted">Classes attended</span>
            <span className="text-h3 font-bold text-heading">{attendanceCount ?? 0}</span>
          </div>
        </div>

        {/* Clubs */}
        {memberClubs.length > 0 && (
          <div className="space-y-3">
            <p className="text-label text-muted uppercase tracking-wider">Member at</p>
            <div className="space-y-2">
              {memberClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  className="flex items-center justify-between p-3 bg-surface-raised border border-border rounded-xl hover:border-brand/40 transition-colors"
                >
                  <div>
                    <p className="text-body font-medium text-heading">{club.name}</p>
                    <p className="text-caption text-muted">{CATEGORY_LABELS[club.business_type] ?? club.business_type}</p>
                  </div>
                  <span className="text-caption text-muted">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="space-y-3">
          <p className="text-label text-muted uppercase tracking-wider">
            Achievements
            {achievements.length > 0 && (
              <span className="ml-2 text-caption text-muted normal-case">
                {achievements.length}
              </span>
            )}
          </p>
          {achievements.length > 0 ? (
            <div className="space-y-2">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 bg-surface-raised border border-border rounded-xl"
                >
                  <span className="text-[26px] leading-none shrink-0">{a.badgeIcon ?? "🎯"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-semibold text-heading leading-tight">{a.title}</p>
                    {a.description && (
                      <p className="text-caption text-muted mt-0.5">{a.description}</p>
                    )}
                    <p className="text-caption text-muted mt-1">
                      {a.clubName && (
                        <Link href={`/clubs/${a.clubSlug}`} className="hover:text-brand transition-colors">
                          {a.clubName}
                        </Link>
                      )}
                      {" · "}
                      {new Date(a.awardedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-surface-raised border border-border rounded-xl text-center">
              <p className="text-muted text-body">No achievements yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
