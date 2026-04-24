import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-[calc(100vh-0px)] w-full flex items-center justify-center p-6 bg-background">
      <SignUp
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/onboarding"
        forceRedirectUrl="/onboarding"
      />
    </div>
  );
}
