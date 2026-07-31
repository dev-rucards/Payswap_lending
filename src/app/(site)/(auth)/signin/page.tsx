import Signin from "@/components/Auth/SignIn";
import Breadcrumb from "@/components/Common/Breadcrumb";
import Reveal from "@/components/animations/Reveal";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Sign In | Property",
};

const SigninPage = () => {
  return (
    <>
      <Breadcrumb pageName="Sign In Page" />

      <Reveal from="flip">
        <Signin />
      </Reveal>
    </>
  );
};

export default SigninPage;
