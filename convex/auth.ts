import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import Password from "./CustomProfile";
 
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
        if(args.existingUserId){
            return args.existingUserId;
        }

        const existingUser = await ctx.runQuery(internal.users.getUserByEmail, { email: args.profile.email! });
        if(existingUser){
            return existingUser._id;
        }

        return ctx.db.insert("users", {
            email: args.profile.email!,
            displayName: args.profile.displayName!,
            role: 0,
            searchKey: (args.profile.displayName as string)!.toLowerCase() + args.profile.email!.toLowerCase(),
        });
    }
  }
});