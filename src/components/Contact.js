import React from "react";

export default function Contact() {
  return (
    <section id="contact" className="relative">
      <br></br>
      <br></br>
      <div className="container px-5 py-10 mx-auto flex sm:flex-nowrap flex-wrap">
        <div className="lg:w-2/3 md:w-1/2 bg-gray-900 rounded-lg overflow-hidden sm:mr-10 p-10 flex items-end justify-start relative">
          <iframe
            title="map"
            className="absolute inset-0 w-full h-full"
            frameBorder={0}
            style={{ filter: "opacity(0.7)" }}
            src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=concrete%20Destina%20+(My%20Business%20Name)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
          ></iframe>
          <div className="bg-gray-900 relative flex flex-wrap py-6 rounded shadow-md">
            <div className="lg:w-1/2 px-12">
              <h2 className="title-font font-bold text-white tracking-widest text-xs py-1">
                ADDRESS
              </h2>
              <p className="text-green-200 leading-relaxed">
                Serilingampally, <br />
                Hyderabad 500019
              </p>
            </div>
            <div className="lg:w-1/2 px-4 mt-4 lg:mt-0">
              <h2 className="title-font font-bold text-white tracking-widest text-xs">
                EMAIL
              </h2>
              <a
                href="mailto:riturajkulshresth@gmail.com"
                className="text-green-200 leading-relaxed block"
              >
                riturajkulshresth@gmail.com
              </a>
              <h2 className="title-font font-bold text-white tracking-widest text-xs mt-4">
                PHONE
              </h2>
              <p className="text-green-200 leading-relaxed">7004742004</p>
            </div>
          </div>
        </div>
        <form
          // netlify
          name="contact"
          className="lg:w-1/3 md:w-1/2 flex flex-col md:ml-auto w-full md:py-8 mt-8 md:mt-0"
        >
          <h2 className="text-gray-800 sm:text-4xl text-3xl mb-1 font-medium title-font">
            Hire Me / Collaborate
          </h2>
          <p className="leading-relaxed mb-5">
            I'm always pumped to bring my tech skills and experience to the
            table, whipping up some seriously cool software. I thrive on taking
            up new challenges and am all in for teaming up on something
            interesting. Super stoked about the chance to work together and dive
            into the tech playground. Let's make some awesome stuff happen! 🚀
          </p>
          <a
            href="mailto:riturajkulshresth@gmail.com"
            className="text-center font-bold text-white bg-green-600 border-0 py-2 px-6 focus:outline-none hover:bg-green-700 rounded text-lg"
          >
            Email Me!
          </a>
        </form>
      </div>
    </section>
  );
}
