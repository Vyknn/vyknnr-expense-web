import { IconInbox } from "@tabler/icons-react";
import { requireRole, requireUser } from "@/features/auth/services/auth";
import { ROLE_LABELS } from "@/types/role";
import { CreateMemberModal } from "./CreateMemberModal";
import { EditMemberRoleModal } from "./EditMemberRoleModal";
import { MemberStatusToggle } from "./MemberStatusToggle";
import { getAllMembers, type MemberSummary } from "./queries";

export default async function MembersPage() {
  const currentUser = await requireUser();
  requireRole(currentUser, "admin");
  const members = await getAllMembers();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">สมาชิก</h1>
          <p className="mt-2 text-sm text-muted">จัดการบัญชีผู้ใช้งาน สิทธิ์การเข้าถึง และสถานะการใช้งาน</p>
        </div>
        <CreateMemberModal />
      </header>

      <section
        aria-label="รายชื่อสมาชิก"
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-border px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">บัญชีผู้ใช้งาน</h2>
            <span className="rounded-full bg-muted-surface px-2 py-0.5 text-xs font-medium text-muted">
              {members.length}
            </span>
          </div>
        </div>

        {members.length === 0 ? (
          <EmptyState />
        ) : (
          <MemberList members={members} currentUserId={currentUser.id} />
        )}
      </section>
    </div>
  );
}

function MemberList({
  members,
  currentUserId,
}: {
  members: MemberSummary[];
  currentUserId: number;
}) {
  return (
    <>
      <ul className="flex flex-col gap-3 p-3 md:hidden">
        {members.map((member) => {
          const isSelf = member.id === currentUserId;
          return (
            <li
              key={member.id}
              className="flex flex-col gap-3 rounded-xl border border-border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {member.displayName}
                    {isSelf && (
                      <span className="ml-1.5 text-xs font-normal text-muted">(คุณ)</span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted">{member.email}</p>
                </div>
                <MemberStatusToggle
                  memberId={member.id}
                  memberName={member.displayName}
                  isActive={member.isActive}
                  disabled={isSelf}
                />
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="rounded-full bg-muted-surface px-2 py-0.5 text-xs font-medium text-muted">
                  {ROLE_LABELS[member.role]}
                </span>
                {!isSelf && <EditMemberRoleModal member={member} />}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted-surface text-left text-muted">
              <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">ชื่อสมาชิก</th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">อีเมล</th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">สิทธิ์การใช้งาน</th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">สถานะ</th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">เพิ่มเมื่อ</th>
              <th className="w-20 px-4 py-3">
                <span className="sr-only">จัดการ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelf = member.id === currentUserId;
              return (
                <tr
                  key={member.id}
                  className="border-b border-border last:border-0 hover:bg-muted-surface/70"
                >
                  <td className="px-4 py-1.5 font-semibold">
                    {member.displayName}
                    {isSelf && (
                      <span className="ml-1.5 text-xs font-normal text-muted">(คุณ)</span>
                    )}
                  </td>
                  <td className="px-4 py-1.5 text-muted">{member.email}</td>
                  <td className="px-4 py-1.5">{ROLE_LABELS[member.role]}</td>
                  <td className="px-4 py-1.5">
                    <MemberStatusToggle
                      memberId={member.id}
                      memberName={member.displayName}
                      isActive={member.isActive}
                      disabled={isSelf}
                    />
                  </td>
                  <td className="px-4 py-1.5 text-muted">
                    {new Date(member.createdAt).toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-3 py-1.5">{!isSelf && <EditMemberRoleModal member={member} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-14 text-center text-muted">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
        <IconInbox aria-hidden className="h-7 w-7" />
      </span>
      <p className="text-sm">ยังไม่มีสมาชิก กด “เพิ่มสมาชิก” เพื่อเริ่มต้น</p>
    </div>
  );
}
