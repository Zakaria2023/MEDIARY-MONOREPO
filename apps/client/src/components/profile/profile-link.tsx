"use client";

import { ProfileLink as ProfileLinkData } from "@/db/types";
import { useCreatorLink } from "@/app/(site)/profile/[username]/use-creator-link";

type ProfileLinkProps = {
  link: ProfileLinkData;
  userUuid: string;
  /** A verified creator's presses are counted for their dashboard. */
  isCreator: boolean;
};

/** One of the links a member shows on their profile, straight to its address. */
export const ProfileLink = ({ link, userUuid, isCreator }: ProfileLinkProps) => {
  const { onClick } = useCreatorLink(userUuid, isCreator);

  return (
    <a
      href={link.url}
      rel="me noopener noreferrer nofollow"
      target="_blank"
      onClick={onClick}
      className="text-secondary transition-colors hover:text-ink"
    >
      {link.label}
    </a>
  );
};
