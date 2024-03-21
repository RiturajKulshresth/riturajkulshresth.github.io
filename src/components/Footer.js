import React from "react";
import { GrInstagram } from "react-icons/gr";
import { FaLinkedinIn } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const socialLinks = [
  {
    icon: <FaFacebook className="mr-2" size={36} />,
    href: "https://www.facebook.com/rituraj.kulshresth.10/",
  },
  {
    icon: <FaLinkedinIn className="mr-2" size={36} />,
    href: "https://www.linkedin.com/in/rituraj-kulshresth/",
  },
  {
    icon: <GrInstagram className="mr-2" size={36} />,
    href: "https://www.instagram.com/riturajkulshresth/",
  },
  {
    icon: <FaGithub className="mr-2" size={36} />,
    href: "https://github.com/RiturajKulshresth",
  },
  {
    icon: <FaXTwitter className="mr-2" size={36} />,
    href: "https://twitter.com/BlehRituraj",
  },
];

export default function Contact() {
  return (
    <section id="contact" className="relative">
      <footer className="flex flex-col space-y-10 justify-center m-10">
        <nav className="flex justify-center flex-wrap gap-6 text-gray-500 font-medium">
          <a href="#about" className="hover:text-gray-900">
            About
          </a>
          <a href="#projects" className="hover:text-gray-900">
            Projects
          </a>
          <a href="#skills" className="hover:text-gray-900">
            Skills
          </a>
          <a href="#contact" className="hover:text-gray-900">
            Contact
          </a>
        </nav>

        <div className="flex justify-center space-x-5">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.icon}
            </a>
          ))}
        </div>
        <p className="text-center text-gray-700 font-medium">
          Rituraj Kulshresth
        </p>
      </footer>
    </section>
  );
}
