import React, { FC } from "react";
import Image from "next/image";

type Props = {};

const Hero: FC<Props> = (props) => {
  return (
    <div className="w-[full] h-[calc(100vh-180px)]">
      <div
        className="top-[100px]  1500px:h-[700px] 
              h-[50vh] hero_animation flex-none 1000px:flex items-center 1000px:mt-[100px] mt-[200px]"
      >
        <div className="hidden 1000px:flex flex-1 justify-end">
          <Image
            src={require("../../../public/assets/test.png")}
            alt=""
            className=" object-contain h-[400px] w-[400px]"
          />
        </div>
        <div className=" flex flex-1 1000px:flex text-center justify-center 1000px:justify-start 1000px:ml-10">
          <h2
            className="dark:text-white text-[#00000c7] 
           font-[600] py-2 1000px:leading-[75px] font-Josefin text-xl"
          >
            Improve Your Online Learning Experience Better Instantly
          </h2>
        </div>
      </div>

      {/* <div className="flex bg-black h-20">
        <div className="bg-white  flex-1 h-10" />
        <div className="bg-pink  flex-1 h-10" />
      </div> */}
    </div>
  );
};

export default Hero;
