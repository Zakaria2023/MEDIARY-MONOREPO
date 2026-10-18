import { useAuth } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { UNNAMED_USER } from "utils";
import { usernameSchema, WelcomeInput, welcomeSchema } from "validators";
import { checkUsername, finishWelcome, suggestUsername } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useMe } from "@/lib/use-me";

/** How long typing has to pause before the handle is checked. */
const CHECK_DELAY_MS = 400;

/**
 * THE WELCOME SCREEN: a new account picks its handle and confirms its name.
 * Starts from a free handle the API suggests and the name the account
 * already has, checks the handle once typing pauses, and on save puts the
 * new row in the cache, which is what lets the app in.
 */
export const useWelcomeForm = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const me = useMe();

  const form = useForm<WelcomeInput>({
    resolver: zodResolver(welcomeSchema),
    defaultValues: { username: "", displayName: "" },
  });

  const suggestion = useQuery({
    queryKey: [...queryKeys.me, "suggestion"],
    queryFn: async () => suggestUsername(await getToken()),
    enabled: me.data !== undefined && !me.data.username,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (suggestion.data && !form.getValues("username")) {
      form.setValue("username", suggestion.data.username);
    }
  }, [suggestion.data, form]);

  useEffect(() => {
    const name = me.data?.displayName;
    if (name && name !== UNNAMED_USER && !form.getValues("displayName")) {
      form.setValue("displayName", name);
    }
  }, [me.data?.displayName, form]);

  const typed = useWatch({ control: form.control, name: "username" });
  const settled = useDebouncedValue(typed, CHECK_DELAY_MS);
  const candidate = usernameSchema.safeParse(settled);
  const handle = candidate.success ? candidate.data : null;

  const availability = useQuery({
    queryKey: [...queryKeys.me, "available", handle],
    queryFn: async () => {
      if (!handle) {
        throw new Error("No username to check");
      }
      return checkUsername(handle, await getToken());
    },
    enabled: handle !== null,
  });

  const save = useMutation({
    mutationFn: async (input: WelcomeInput) => finishWelcome(input, await getToken()),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
    },
  });

  const onSubmit = () => {
    void form.handleSubmit((values) => save.mutate(values))();
  };

  const usernameStatus =
    handle === null
      ? null
      : typed !== settled || availability.isFetching
        ? "Checking…"
        : availability.data?.available
          ? "That one is free."
          : availability.data
            ? "That username is taken. Try another."
            : null;

  return {
    form,
    me,
    usernameStatus,
    error: save.error?.message ?? null,
    isPending: save.isPending,
    onSubmit,
  };
};
