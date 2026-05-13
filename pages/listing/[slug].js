export default function IronXchangeListingPage() {
  const thumbs = [
    'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1600&auto=format&fit=crop'
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* NAV */}
      <header className="border-b border-zinc-200 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black tracking-tight">
              IRON<span className="text-amber-500">X</span>CHANGE
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide">
            <a href="#">Browse</a>
            <a href="#">Sell Equipment</a>
            <a href="#">Dealers</a>
            <a href="#">Login</a>
          </nav>
        </div>
      </header>

      {/* TITLE AREA */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="uppercase text-xs tracking-[0.25em] text-zinc-500 font-bold mb-3">
              Motor Graders
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
              2020 DEERE 872GP
            </h1>

            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-5 text-sm md:text-base text-zinc-700 font-semibold">
              <span>3,875 hrs</span>
              <span className="text-zinc-300">•</span>
              <span>Colorado City, TX</span>
              <span className="text-zinc-300">•</span>
              <span>SN: 1DW872GPALE692551</span>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4">
            <div className="text-4xl md:text-5xl font-black tracking-tight">
              $179,000
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              <button className="bg-amber-400 hover:bg-amber-300 transition text-black font-black px-6 py-3 rounded-full text-sm tracking-wide w-full lg:w-auto">
                CONTACT SELLER
              </button>

              <button className="border border-zinc-300 hover:border-black transition px-5 py-3 rounded-full text-sm font-bold tracking-wide">
                SAVE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HERO IMAGE */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-8">
        <div className="rounded-3xl overflow-hidden bg-zinc-100">
          <img
            src="https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?q=80&w=2200&auto=format&fit=crop"
            className="w-full h-[300px] md:h-[650px] object-cover"
          />
        </div>

        {/* THUMB STRIP */}
        <div className="grid grid-cols-4 gap-3 mt-3">
          {thumbs.map((img, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-zinc-100 aspect-[4/3]">
              <img src={img} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      {/* DESCRIPTION */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 pt-16">
        <div className="uppercase text-xs tracking-[0.25em] text-zinc-500 font-bold mb-6">
          Seller Description
        </div>

        <div className="space-y-6 text-lg md:text-xl leading-relaxed text-zinc-800 font-light">
          <p>
            Clean West Texas machine with strong hours and excellent overall presentation. Machine is work-ready and currently operating daily on county road and site-prep applications.
          </p>

          <p>
            Tight circle, clean cab, matching tires, no active fault codes reported. Equipped with push block, rear ripper, and grade-control ready hydraulics.
          </p>

          <p>
            Dealer maintained. Financing and freight available nationwide.
          </p>
        </div>
      </section>

      {/* SPECS */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-20 pb-24">
        <div className="uppercase text-xs tracking-[0.25em] text-zinc-500 font-bold mb-8">
          Specifications
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 border-t border-zinc-200">
          {[
            ['Year', '2020'],
            ['Make', 'Deere'],
            ['Model', '872GP'],
            ['Hours', '3,875'],
            ['Category', 'Motor Grader'],
            ['Location', 'Colorado City, TX'],
            ['Drive', 'AWD'],
            ['Horsepower', '280 hp'],
            ['Ripper', 'Yes'],
            ['Push Block', 'Yes'],
            ['Cab', 'Enclosed / AC'],
            ['Condition', 'Work Ready'],
          ].map(([label, value], i) => (
            <div
              key={i}
              className="py-7 border-b border-zinc-200 md:pr-10"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold mb-2">
                {label}
              </div>
              <div className="text-2xl font-black tracking-tight">
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

