import { SignUp } from '@clerk/nextjs';
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] gap-8">
      <Image
        src="/gpc-ai-logo.png"
        alt="GPC AI Logo"
        width={200}
        height={200}
        className="object-contain"
      />
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-2xl",
            headerTitle: "hidden",
            headerSubtitle: "text-center",
            logoBox: "hidden",
            logoImage: "hidden"
          }
        }}
      />
    </div>
  );
}
