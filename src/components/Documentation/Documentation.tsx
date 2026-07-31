"use client";

import Reveal from "@/components/animations/Reveal"
import { Configuration } from "./Configuration"
import { DocNavigation } from "./DocNavigation"
import { Introduction } from "./Introduction"
import { PackageStructure } from "./PackageStructure"
import { QuickStart } from "./QuickStart"


export const Documentation = () => {
    return (
        <div className="bg-darkmode md:pt-0 pt-12" >
            <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md p-6 lg:pt-44 pt-16">
               <div className="grid grid-cols-12 gap-6">
                <Reveal from="left" className="lg:col-span-3 col-span-12 lg:block hidden">
                  <DocNavigation/>
                </Reveal>
                <div className="lg:col-span-9 col-span-12">
                <Reveal from="bottom"><Introduction /></Reveal>
                <Reveal from="bottom"><PackageStructure/></Reveal>
                <Reveal from="bottom"><QuickStart/></Reveal>
                <Reveal from="bottom"><Configuration/></Reveal>
                </div>
               </div>
            </div>
        </div>
    )
}