import React from "react";
import { CheckBadgeIcon, CpuChipIcon } from "@heroicons/react/24/solid";
import { skills, languages } from "../data";

export default function Skills() {
  return (
    <section id="skills" className="container px-5 py-10 mx-auto">
      <br></br>
      <br></br>
      <br></br>
      <div className="text-center mb-20">
        <CpuChipIcon className="w-10 inline-block mb-4" />
        <h1 className="sm:text-4xl text-3xl font-medium title-font text-gray-900 mb-4">
          Skills &amp; Technologies
        </h1>
        <p className="text-base leading-relaxed xl:w-2/4 lg:w-3/4 mx-auto">
          I'm pretty good at C/C++, Python, JavaScript, and Assembly – dabbled
          in a bunch of other languages too. I've danced with a mix of tech
          tools across the whole Software Development Life Cycle. It's been a
          wild ride, but hey, I can handle it! 🎉
        </p>
      </div>

      <div className="text-center">
        <h4 className="sm:text-2xl text-3xl font-medium title-font text-gray-900 mb-4">
          Languages
        </h4>
      </div>
      <ul className="flex flex-wrap lg:w-4/5 sm:mx-auto sm:mb-2 -mx-2">
        {languages.map((language) => (
          <li key={language} className="p-2 sm:w-1/2 w-full">
            <div className="bg-green-600 rounded flex p-4 h-full items-center">
              <CheckBadgeIcon className="text-gray-800 w-6 h-6 flex-shrink-0 mr-4" />
              <span className="title-font font-medium text-white">
                {language}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="text-center mt-10">
        <h4 className="sm:text-2xl text-3xl font-medium title-font text-gray-900 mb-4">
          Technologies
        </h4>
      </div>
      <ul className="flex flex-wrap lg:w-4/5 sm:mx-auto sm:mb-2 -mx-2">
        {skills.map((technology) => (
          <li key={technology} className="p-2 sm:w-1/2 w-full">
            <div className="bg-gray-800 rounded flex p-4 h-full items-center">
              <CheckBadgeIcon className="text-green-500 w-6 h-6 flex-shrink-0 mr-4" />
              <span className="title-font font-medium text-white">
                {technology}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
