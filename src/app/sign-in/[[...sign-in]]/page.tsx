import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-[calc(100vh-0px)] w-full flex items-center justify-center p-6 bg-background">
      <SignIn
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/onboarding"
        forceRedirectUrl="/onboarding"
      />
    </div>
  );
}
