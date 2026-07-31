import SignUp from "@/components/Auth/SignUp";
import Breadcrumb from "@/components/Common/Breadcrumb";
import Reveal from "@/components/animations/Reveal";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Sign Up | Property",
};

const SignupPage = () => {
  return (
    <>
      <Breadcrumb pageName="Sign Up Page" />

      <Reveal from="flip">
        <SignUp />
      </Reveal>
    </>
  );
};

export default SignupPage;
