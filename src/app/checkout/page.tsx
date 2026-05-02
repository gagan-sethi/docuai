// import { Suspense } from "react";
// import CheckoutClient from "./CheckoutClient";

// export default function CheckoutPage() {
//   return (
//     <Suspense fallback={<p style={{ textAlign: "center" }}>Initializing payment...</p>}>
//       <CheckoutClient />
//     </Suspense>
//   );
// }

import { Suspense } from "react";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-primary to-slate-900">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-[320px] shadow-xl">

            {/* Logo / Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary animate-pulse" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zm0 7l-10 5 10 5 10-5-10-5z" />
                </svg>
              </div>
            </div>

            {/* Skeleton content */}
            <div className="space-y-3">
              <div className="h-3 bg-white/10 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-white/10 rounded w-full animate-pulse" />
              <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse" />
            </div>

            {/* Loader */}
            <div className="flex justify-center mt-6">
              <div className="w-6 h-6 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
            </div>

            <p className="text-center text-xs text-white/60 mt-4">
              Preparing secure checkout...
            </p>
          </div>
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}