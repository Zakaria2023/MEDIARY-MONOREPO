import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your Mediary",
};

/**
 * Clerk's sign-up. Once the account exists the webhook mirrors it into
 * Users, and the welcome screen asks for the username.
 */
const SignUpPage = () => <SignUp />;

export default SignUpPage;
