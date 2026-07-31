"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { headerData } from "../Header/Navigation/menuData";
import Logo from "./Logo";
import Image from "next/image";
import HeaderLink from "../Header/Navigation/HeaderLink";
import MobileHeaderLink from "../Header/Navigation/MobileHeaderLink";
import Signin from "@/components/Auth/SignIn";
import SignUp from "@/components/Auth/SignUp";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react/dist/iconify.js";
import { gsap } from "@/lib/gsap";
import MagneticButton from "@/components/animations/MagneticButton";

const Header: React.FC = () => {
  const pathUrl = usePathname();
  const { theme, setTheme } = useTheme();

  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const navbarRef = useRef<HTMLDivElement>(null);
  const signInRef = useRef<HTMLDivElement>(null);
  const signUpRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileBackdropRef = useRef<HTMLDivElement>(null);
  const mobileLinksRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    setSticky(window.scrollY >= 80);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      signInRef.current &&
      !signInRef.current.contains(event.target as Node)
    ) {
      setIsSignInOpen(false);
    }
    if (
      signUpRef.current &&
      !signUpRef.current.contains(event.target as Node)
    ) {
      setIsSignUpOpen(false);
    }
    if (
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(event.target as Node) &&
      navbarOpen
    ) {
      setNavbarOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [navbarOpen, isSignInOpen, isSignUpOpen]);

  useEffect(() => {
    if (isSignInOpen || isSignUpOpen || navbarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isSignInOpen, isSignUpOpen, navbarOpen]);

  // Logo entrance
  useEffect(() => {
    if (!logoRef.current) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.from(logoRef.current, {
        autoAlpha: 0,
        y: -14,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.1,
      });
    });
    return () => ctx.revert();
  }, []);

  // Sliding pill indicator that follows the hovered nav link
  useEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!nav || !pill) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;

    const moveTo = (target: HTMLElement) => {
      const navRect = nav.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      gsap.to(pill, {
        x: rect.left - navRect.left,
        width: rect.width,
        autoAlpha: 1,
        duration: 0.45,
        ease: "power3.out",
      });
    };

    const handleOver = (e: Event) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (anchor && nav.contains(anchor)) moveTo(anchor as HTMLElement);
    };
    const handleLeave = () => {
      gsap.to(pill, { autoAlpha: 0, duration: 0.3 });
    };

    nav.addEventListener("mouseover", handleOver);
    nav.addEventListener("mouseleave", handleLeave);
    return () => {
      nav.removeEventListener("mouseover", handleOver);
      nav.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  // Auth modals swing in on the X axis out of depth
  useEffect(() => {
    const panel = isSignInOpen
      ? signInRef.current
      : isSignUpOpen
        ? signUpRef.current
        : null;
    if (!panel) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const backdrop = panel.parentElement;
      const tl = gsap.timeline();

      if (backdrop) {
        tl.fromTo(
          backdrop,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.28, ease: "power2.out" },
          0
        );
      }

      tl.fromTo(
        panel,
        {
          autoAlpha: 0,
          y: 40,
          z: -420,
          rotateX: -28,
          scale: 0.94,
          transformPerspective: 1200,
          transformOrigin: "50% 0%",
        },
        {
          autoAlpha: 1,
          y: 0,
          z: 0,
          rotateX: 0,
          scale: 1,
          duration: 0.7,
          ease: "payswapOut",
          force3D: true,
        },
        0.05
      ).from(
        panel.querySelectorAll("input, button, a, h3, p, label"),
        {
          y: 18,
          autoAlpha: 0,
          duration: 0.45,
          stagger: 0.035,
          ease: "power3.out",
        },
        0.22
      );
    }, panel);

    return () => ctx.revert();
  }, [isSignInOpen, isSignUpOpen]);

  // GSAP-driven mobile menu open/close
  const mobileMenuMounted = useRef(false);
  useEffect(() => {
    const panel = mobileMenuRef.current;
    const backdrop = mobileBackdropRef.current;
    const linksWrap = mobileLinksRef.current;
    if (!panel) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // First run: snap to the correct closed state instantly, no animation.
    if (!mobileMenuMounted.current) {
      mobileMenuMounted.current = true;
      gsap.set(panel, { xPercent: 100 });
      if (backdrop) gsap.set(backdrop, { autoAlpha: 0 });
      if (!navbarOpen) return;
    }

    // No context/revert here: reverting on close would snap the panel shut
    // before the close tween could play. Instead, overwrite in-flight tweens
    // and animate to the target state.
    const links = linksWrap ? Array.from(linksWrap.children) : [];
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    if (navbarOpen) {
      if (backdrop) {
        tl.to(backdrop, { autoAlpha: 1, duration: 0.3, overwrite: "auto" }, 0);
      }
      tl.to(
        panel,
        {
          xPercent: 0,
          duration: reduced ? 0 : 0.55,
          ease: "power4.out",
          overwrite: "auto",
        },
        0
      );
      if (links.length) {
        tl.fromTo(
          links,
          { x: 28, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.4,
            stagger: 0.06,
            overwrite: "auto",
          },
          reduced ? 0 : 0.22
        );
      }
    } else {
      if (backdrop) {
        tl.to(backdrop, { autoAlpha: 0, duration: 0.25, overwrite: "auto" }, 0);
      }
      tl.to(
        panel,
        {
          xPercent: 100,
          duration: reduced ? 0 : 0.4,
          ease: "power3.in",
          overwrite: "auto",
        },
        0
      );
    }

    return () => {
      tl.kill();
    };
  }, [navbarOpen]);

  return (
    <header
      className={`fixed top-0 z-40 w-full pb-5 transition-all duration-300 ${
        sticky ? " shadow-lg bg-darkmode pt-5" : "shadow-none md:pt-14 pt-5"
      }`}
    >
      <div className="lg:py-0 py-2">
        <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md flex items-center justify-between px-4">
          <div ref={logoRef}>
            <Logo />
          </div>
          <nav
            ref={navRef}
            /* xl, not lg: at 1024–1279px the six links + both auth buttons
               overflow the container and wrap on top of each other. */
            className="relative hidden xl:flex flex-grow items-center justify-center gap-8 whitespace-nowrap"
          >
            <div
              ref={pillRef}
              className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-0 rounded-full bg-white/10 opacity-0 pointer-events-none"
            />
            {headerData.map((item, index) => (
              <HeaderLink key={index} item={item} />
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-4">
            {/* <button
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center text-body-color duration-300 dark:text-white"
            >
              <svg
                viewBox="0 0 16 16"
                className={`hidden h-6 w-6 dark:block ${
                  !sticky && pathUrl === "/" && "text-white"
                }`}
              >
                <path
                  d="M4.50663 3.2267L3.30663 2.03337L2.36663 2.97337L3.55996 4.1667L4.50663 3.2267ZM2.66663 7.00003H0.666626V8.33337H2.66663V7.00003ZM8.66663 0.366699H7.33329V2.33337H8.66663V0.366699V0.366699ZM13.6333 2.97337L12.6933 2.03337L11.5 3.2267L12.44 4.1667L13.6333 2.97337ZM11.4933 12.1067L12.6866 13.3067L13.6266 12.3667L12.4266 11.1734L11.4933 12.1067ZM13.3333 7.00003V8.33337H15.3333V7.00003H13.3333ZM7.99996 3.6667C5.79329 3.6667 3.99996 5.46003 3.99996 7.6667C3.99996 9.87337 5.79329 11.6667 7.99996 11.6667C10.2066 11.6667 12 9.87337 12 7.6667C12 5.46003 10.2066 3.6667 7.99996 3.6667ZM7.33329 14.9667H8.66663V13H7.33329V14.9667ZM2.36663 12.36L3.30663 13.3L4.49996 12.1L3.55996 11.16L2.36663 12.36Z"
                  fill="#FFFFFF"
                />
              </svg>
              <svg
                viewBox="0 0 23 23"
                className={`h-8 w-8 text-dark dark:hidden ${
                  !sticky && pathUrl === "/" && "text-white"
                }`}
              >
                <path d="M16.6111 15.855C17.591 15.1394 18.3151 14.1979 18.7723 13.1623C16.4824 13.4065 14.1342 12.4631 12.6795 10.4711C11.2248 8.47905 11.0409 5.95516 11.9705 3.84818C10.8449 3.9685 9.72768 4.37162 8.74781 5.08719C5.7759 7.25747 5.12529 11.4308 7.29558 14.4028C9.46586 17.3747 13.6392 18.0253 16.6111 15.855Z" />
              </svg>
            </button> */}
            <MagneticButton className="hidden xl:inline-block shrink-0">
              <Link
                href="#"
                className="bg-transparent text-primary border hover:bg-primary border-primary hover:text-darkmode px-4 py-2 rounded-lg inline-block"
                onClick={() => {
                  setIsSignInOpen(true);
                }}
              >
                Sign In
              </Link>
            </MagneticButton>
            {isSignInOpen && (
              <div
                className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50"
                style={{ perspective: "1200px" }}
              >
                <div
                  ref={signInRef}
                  className="relative mx-auto w-full max-w-md overflow-hidden rounded-lg px-8 pt-14 pb-8 text-center bg-dark_grey bg-opacity-90 backdrop-blur-md"
                >
                  <button
                    onClick={() => setIsSignInOpen(false)}
                    className="absolute top-0 right-0 mr-8 mt-8 dark:invert"
                    aria-label="Close Sign In Modal"
                  >
                    <Icon
                      icon="tabler:currency-xrp"
                      className="text-white hover:text-primary text-24 inline-block me-2"
                    />
                  </button>
                  <Signin />
                </div>
              </div>
            )}
            <MagneticButton className="hidden xl:inline-block shrink-0">
              <Link
                href="#"
                className="bg-primary text-darkmode hover:bg-transparent hover:text-primary border border-primary px-4 py-2 rounded-lg inline-block"
                onClick={() => {
                  setIsSignUpOpen(true);
                }}
              >
                Sign Up
              </Link>
            </MagneticButton>
            {isSignUpOpen && (
              <div
                className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50"
                style={{ perspective: "1200px" }}
              >
                <div
                  ref={signUpRef}
                  className="relative mx-auto w-full max-w-md overflow-hidden rounded-lg bg-dark_grey bg-opacity-90 backdrop-blur-md px-8 pt-14 pb-8 text-center"
                >
                  <button
                    onClick={() => setIsSignUpOpen(false)}
                    className="absolute top-0 right-0 mr-8 mt-8 dark:invert"
                    aria-label="Close Sign Up Modal"
                  >
                    <Icon
                      icon="tabler:currency-xrp"
                      className="text-white hover:text-primary text-24 inline-block me-2"
                    />
                  </button>
                  <SignUp />
                </div>
              </div>
            )}
            <button
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="block xl:hidden p-2 rounded-lg"
              aria-label="Toggle mobile menu"
            >
              <span className="block w-6 h-0.5 bg-white"></span>
              <span className="block w-6 h-0.5 bg-white mt-1.5"></span>
              <span className="block w-6 h-0.5 bg-white mt-1.5"></span>
            </button>
          </div>
        </div>
        <div
          ref={mobileBackdropRef}
          onClick={() => setNavbarOpen(false)}
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40 opacity-0 invisible"
        />
        <div
          ref={mobileMenuRef}
          className="xl:hidden fixed top-0 right-0 h-full w-full bg-darkmode shadow-lg max-w-xs translate-x-full z-50"
        >
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-bold text-midnight_text dark:text-midnight_text">
              <Logo />
            </h2>

            {/*  */}
            <button
              onClick={() => setNavbarOpen(false)}
              className="bg-[url('/images/closed.svg')] bg-no-repeat bg-contain w-5 h-5 absolute top-0 right-0 mr-8 mt-8 dark:invert"
              aria-label="Close menu Modal"
            ></button>
          </div>
          <nav ref={mobileLinksRef} className="flex flex-col items-start p-4">
            {headerData.map((item, index) => (
              <MobileHeaderLink key={index} item={item} />
            ))}
            <div className="mt-4 flex flex-col space-y-4 w-full">
              <Link
                href="#"
                className="bg-transparent border border-primary text-primary px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white"
                onClick={() => {
                  setIsSignInOpen(true);
                  setNavbarOpen(false);
                }}
              >
                Sign In
              </Link>
              <Link
                href="#"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                onClick={() => {
                  setIsSignUpOpen(true);
                  setNavbarOpen(false);
                }}
              >
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
