export default function Home() {
  return (
    <div className="w-[1728px] h-[5559px] relative bg-white overflow-hidden">
      {/* Background Lines */}
      <div className="w-[1728px] h-[1px] left-0 top-[106px] absolute bg-neutral-200"></div>
      <div className="w-[1470px] h-[1px] left-[129px] top-[228px] absolute bg-neutral-200"></div>
      <div className="w-80 h-[1px] left-[285px] top-[343px] absolute origin-top-left -rotate-90 bg-neutral-200"></div>
      <div className="w-96 h-[1px] left-[528px] top-[410px] absolute origin-top-left rotate-[-89deg] bg-neutral-200"></div>
      <div className="w-96 h-[1px] left-[788px] top-[445px] absolute origin-top-left rotate-[-90deg] bg-neutral-200"></div>
      <div className="w-96 h-[1px] left-[1536px] top-[373px] absolute origin-top-left -rotate-90 bg-neutral-200"></div>
      <div className="w-96 h-[1px] left-[1284px] top-[428px] absolute origin-top-left rotate-[-90deg] bg-neutral-200"></div>
      <div className="w-96 h-[1px] left-[1029px] top-[445px] absolute origin-top-left rotate-[-89deg] bg-neutral-200"></div>
      
      {/* Header */}
      <div className="left-[113px] top-[81px] absolute text-cyan-950 text-4xl font-russo">Satya</div>
      <div className="w-64 h-16 left-[1358px] top-[62px] absolute bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border border-neutral-500 flex items-center justify-center">
        <span className="text-black text-2xl font-light font-albert">Get Started</span>
      </div>
      
      {/* Hero Section */}
      <div className="w-[1155px] left-[286px] top-[342px] absolute text-center text-black text-8xl font-russo">Bringing verifiable + trusted data markets</div>
      <div className="w-[974px] left-[377px] top-[569px] absolute text-center text-black text-2xl font-light font-albert">Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.</div>
      
      {/* CTA Buttons */}
      <div className="w-80 h-20 left-[527px] top-[666px] absolute bg-black rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border border-neutral-500 flex items-center justify-center">
        <span className="text-white text-3xl font-light font-albert">Launch App</span>
      </div>
      <div className="w-80 h-20 left-[879px] top-[666px] absolute bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border border-neutral-500 flex items-center justify-center">
        <span className="text-black text-3xl font-light font-albert">Read Docs</span>
      </div>
      
      {/* Built on Sui Stack */}
      <div className="w-56 h-12 left-[749px] top-[872px] absolute text-center text-neutral-500 text-2xl font-albert">Built on the Sui Stack</div>
      <div className="w-28 h-6 left-[720px] top-[927px] absolute bg-gray-200 rounded flex items-center justify-center">
        <span className="text-xs font-albert text-gray-600">SEAL</span>
      </div>
      <div className="w-28 h-8 left-[890px] top-[923px] absolute bg-gray-200 rounded flex items-center justify-center">
        <span className="text-xs font-albert text-gray-600">WALRUS</span>
      </div>
      
      {/* Trusted Marketplaces */}
      <div className="w-[1013px] left-[113px] top-[1096px] absolute text-black text-6xl font-russo">Trusted Marketplaces</div>
      <div className="w-[832px] left-[118px] top-[1199px] absolute text-black text-2xl font-light font-albert">Eliminating the &ldquo;Trust me bro&rdquo; barrier with sensitive markets.</div>

      {/* Model Cards */}
      <div className="w-[533px] h-[827px] left-[39px] top-[1292px] absolute rounded-3xl border border-stone-300 bg-black overflow-hidden">
        <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black"></div>
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h3 className="text-4xl font-russo mb-4">AI Model x129</h3>
          <p className="text-base font-albert mb-6 w-72">Model with training data from top NHS inc. hospitals, works like magic.</p>
          <div className="w-40 h-10 bg-zinc-300 rounded-[30px] flex items-center justify-center">
            <span className="text-black text-base font-albert">Verify Model</span>
          </div>
        </div>
      </div>

      <div className="w-[533px] h-[586px] left-[597px] top-[1292px] absolute rounded-3xl border border-neutral-400 bg-gray-600 overflow-hidden">
        <div className="w-full h-2/3 bg-gradient-to-br from-gray-400 to-gray-600"></div>
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h3 className="text-4xl font-russo mb-4">Opus Model x229</h3>
          <p className="text-base font-albert text-zinc-300 mb-6 w-72">Model with training data from top NHS inc. hospitals, works like magic.</p>
          <div className="w-40 h-10 bg-zinc-500 rounded-[30px] flex items-center justify-center">
            <span className="text-white text-base font-albert">Verify Model</span>
          </div>
        </div>
      </div>

      <div className="w-[533px] h-[586px] left-[1155px] top-[1300px] absolute rounded-3xl border border-stone-300 bg-black overflow-hidden">
        <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black"></div>
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h3 className="text-4xl font-russo mb-4">Self Drive Model</h3>
          <p className="text-base font-albert mb-6 w-72">Model with training data from top NHS inc. hospitals, works like magic.</p>
          <div className="w-40 h-10 bg-zinc-300 rounded-[30px] flex items-center justify-center">
            <span className="text-black text-base font-albert">Verify Model</span>
          </div>
        </div>
      </div>

      <div className="w-[533px] h-80 left-[39px] top-[2138px] absolute rounded-3xl border border-neutral-400 bg-gray-500 overflow-hidden">
        <div className="w-full h-2/3 bg-gradient-to-br from-gray-400 to-gray-600"></div>
        <div className="absolute bottom-8 left-8 right-8 text-zinc-300">
          <h3 className="text-4xl font-russo mb-4">Self Drive Model</h3>
          <p className="text-base font-albert w-72">Model with training data from top NHS inc. hospitals, works like magic.</p>
        </div>
      </div>

      <div className="w-[1092px] h-[586px] left-[596px] top-[1899px] absolute rounded-3xl border border-stone-300 bg-black overflow-hidden">
        <div className="w-full h-2/3 bg-gradient-to-br from-gray-800 to-black"></div>
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h3 className="text-4xl font-russo mb-4">Self Drive Model</h3>
          <p className="text-base font-albert mb-6 w-72">Model with training data from top NHS inc. hospitals, works like magic.</p>
          <div className="flex gap-4">
            <div className="w-40 h-10 bg-zinc-500 rounded-[30px] flex items-center justify-center">
              <span className="text-white text-base font-albert">Verify Model</span>
            </div>
            <div className="w-40 h-10 bg-zinc-300 rounded-[30px] flex items-center justify-center">
              <span className="text-black text-base font-albert">Verify Model</span>
            </div>
          </div>
        </div>
      </div>

      {/* Built on Sui Stack Section */}
      <div className="w-[1155px] left-[285px] top-[2606px] absolute text-center text-black text-6xl font-russo">Built on the Sui Stack</div>
      <div className="w-[974px] left-[373px] top-[2695px] absolute text-center text-black text-2xl font-light font-albert">Model with training data from top NHS inc. hospitals, works like magic.</div>
      
      {/* Feature Grid */}
      <div className="w-96 h-56 left-[88px] top-[2761px] absolute bg-white border border-black"></div>
      <div className="w-96 h-56 left-[484px] top-[2761px] absolute bg-white border border-black"></div>
      <div className="w-96 h-56 left-[880px] top-[2761px] absolute bg-white border border-black"></div>
      <div className="w-96 h-56 left-[1276px] top-[2761px] absolute bg-white border border-black"></div>

      {/* Trust Enforced Section */}
      <div className="w-[490px] left-[82px] top-[3119px] absolute text-black text-6xl font-russo">Trust Enforced</div>
      <div className="w-[514px] left-[83px] top-[3274px] absolute text-black text-2xl font-light font-albert">Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.</div>
      <div className="w-80 h-20 left-[82px] top-[3605px] absolute bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border border-neutral-500 flex items-center justify-center">
        <span className="text-black text-3xl font-light font-albert">Read Docs</span>
      </div>
      
      <div className="w-[933px] h-[568px] left-[709px] top-[3119px] absolute bg-stone-50 rounded-[50px] border border-black p-4">
        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="bg-white rounded-[50px] border border-black"></div>
          <div className="bg-white rounded-[50px] border border-black"></div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="w-36 left-[796px] top-[3808px] absolute text-black text-6xl font-russo">FAQ</div>
      
      {/* FAQ Item 1 - Expanded */}
      <div className="w-[1555px] h-80 left-[85px] top-[3942px] absolute bg-black rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border border-neutral-200 p-8 flex items-center justify-between">
        <div className="text-white">
          <h3 className="text-6xl font-russo mb-6 max-w-[490px]">Trust Enforced</h3>
          <p className="text-2xl font-light font-albert max-w-[514px]">Model with training data from top NHS inc. hospitals, works like magic. Model with training data from top NHS inc. hospitals, works like magic.</p>
        </div>
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
          <div className="w-9 h-0.5 bg-black"></div>
        </div>
      </div>

      {/* FAQ Item 2 */}
      <div className="w-[1555px] h-48 left-[85px] top-[4332px] absolute bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border border-neutral-500 p-8 flex items-center justify-between">
        <div className="text-black">
          <h3 className="text-6xl font-russo max-w-[490px]">Trust Enforced</h3>
        </div>
        <div className="w-24 h-24 bg-white rounded-full border border-black flex items-center justify-center relative">
          <div className="w-9 h-0 border-t-2 border-black"></div>
          <div className="w-0 h-9 border-l-2 border-black absolute"></div>
        </div>
      </div>

      {/* FAQ Item 3 */}
      <div className="w-[1555px] h-48 left-[85px] top-[4571px] absolute bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border border-neutral-500 p-8 flex items-center justify-between">
        <div className="text-black">
          <h3 className="text-6xl font-russo max-w-[490px]">Trust Enforced</h3>
        </div>
        <div className="w-24 h-24 bg-white rounded-full border border-black flex items-center justify-center relative">
          <div className="w-9 h-0 border-t-2 border-black"></div>
          <div className="w-0 h-9 border-l-2 border-black absolute"></div>
        </div>
      </div>

      {/* FAQ Item 4 */}
      <div className="w-[1555px] h-48 left-[85px] top-[4810px] absolute bg-white rounded-[30px] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)] border border-neutral-500 p-8 flex items-center justify-between">
        <div className="text-black">
          <h3 className="text-6xl font-russo max-w-[490px]">Trust Enforced</h3>
        </div>
        <div className="w-24 h-24 bg-white rounded-full border border-black flex items-center justify-center relative">
          <div className="w-9 h-0 border-t-2 border-black"></div>
          <div className="w-0 h-9 border-l-2 border-black absolute"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-[1648px] h-[476px] left-[40px] top-[5040px] absolute bg-black rounded-[50px] border border-stone-300 p-16 relative">
        <div className="flex justify-between items-start h-full">
          <div>
            <h3 className="text-4xl font-russo text-sky-100 mb-8">Satya</h3>
          </div>
          
          <div className="flex gap-32">
            <div className="space-y-6">
              <div className="text-2xl font-light font-albert text-white">Docs</div>
              <div className="text-2xl font-light font-albert text-white">Team</div>
              <div className="text-2xl font-light font-albert text-white">Support</div>
            </div>
            
            <div className="space-y-6">
              <div className="text-2xl font-light font-albert text-white">FAQ</div>
              <div className="text-2xl font-light font-albert text-white">Terms of Service</div>
            </div>
          </div>
        </div>
        
        {/* Social Icons */}
        <div className="absolute bottom-8 right-8 flex gap-4">
          <div className="w-9 h-9 bg-white rounded"></div>
          <div className="w-9 h-9 border border-white rounded flex items-center justify-center">
            <div className="w-7 h-6 border border-white"></div>
          </div>
          <div className="w-7 h-6 bg-white"></div>
        </div>
      </div>
    </div>
  )
}