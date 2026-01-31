import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

const passwordConfig = Password<DataModel>({
  profile: (params) => {
    return {
      email: params.email as string,
      displayName: params.displayName as string,
      role: 0,
      searchKey: (params.displayName as string || "").toLowerCase() + (params.email as string)!.toLowerCase(),
    };
  },
});

export default passwordConfig;