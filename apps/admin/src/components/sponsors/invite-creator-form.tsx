"use client";

import { Button, FormError, Input, Textarea } from "ui";
import { useInviteCreator } from "@/app/(dashboard)/sponsors/[uuid]/use-invite-creator";

type InviteCreatorFormProps = {
  campaignUuid: string;
  sponsor: string;
};

/**
 * Inviting a verified creator. The disclosure is required and is what the
 * creator's list will say under "Paid partnership with", so it is written
 * for the people who read the list, not for the advertiser.
 */
export const InviteCreatorForm = ({ campaignUuid, sponsor }: InviteCreatorFormProps) => {
  const {
    form: { register, formState },
    state,
    isPending,
    onSubmit,
  } = useInviteCreator(campaignUuid, sponsor);
  const errors = formState.errors;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-card border border-hairline bg-surface p-5">
      <h3 className="font-display text-base text-ink">Invite a creator</h3>
      <Input label="Creator's handle" placeholder="@handle" error={errors.username?.message} {...register("username")} />
      <Textarea
        label="What is asked"
        placeholder="A public list of ten games to play before the launch, with a line on each."
        rows={3}
        error={errors.deliverables?.message}
        {...register("deliverables")}
      />
      <Textarea label="Disclosure on the work" rows={2} error={errors.disclosure?.message} {...register("disclosure")} />
      <FormError message={state.error} />
      <div className="flex items-center justify-end gap-3">
        {state.success && !isPending && <span className="text-sm text-success">Invited</span>}
        <Button type="submit" variant="outline" disabled={isPending}>
          {isPending ? "Inviting" : "Invite"}
        </Button>
      </div>
    </form>
  );
};
