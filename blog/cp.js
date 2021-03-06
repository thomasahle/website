
function D(t,p) {
   if (t == 0) return Math.log(1/(1-p));
   if (t == 1) return Math.log(1/p);
   return t*Math.log(t/p) + (1-t)*Math.log((1-t)/(1-p));
}


function simulate(t, p, d, k) {
   // Also: Should we support c_ell vaulues?
   console.log([t,p,d,k]);
   let tot = 0;
   let s = 0;
   while (tot == 0 || tot == s || s < (s/Math.min(tot,s-tot))**2 * 10) {
      s++;
      let reprs = [0];
      let size = 1;
      for (let i = 1; i <= k; i++) {
         let level_size = Math.ceil(Math.pow(d, i)/size);
         size *= level_size;
         const new_reprs = [];
         for (let ii = 0; ii < reprs.length; ii++) {
            const v = reprs[ii];
            for (let j = 0; j < level_size; j++) {
               // Twisting make no sense here, as we should succeed with
               // polynomial probability
               const v1 = v + (Math.random() < p ? 1 : 0);
               //const sig = Math.sqrt(t*(1-t)*i);
               //const rat = t == 0 || t == 1 ? 0 : Math.log(t/p * (1-p)/(1-t));
               //const sig = Math.pow(rat * t*(1-t)*i, 1/3);
               const sig = Math.pow(t*(1-t)*i, 1/3);
               if (Math.abs(v1 - t*i) <= sig)
                  new_reprs.push(v1);
            }
            // Trim to 30 per level
            if (new_reprs.length > 30)
               break;
         }
         reprs = new_reprs;
         // If we got lots of reps, just declare victory
         // This can't actually happen right now though...
         if (reprs.length > 100)
            break;
      }
      //console.log(reprs);
      if (reprs.length != 0)
         tot++;
   }
   const r = Math.log((1-p)/p*t/(1-t));
   const si = Math.sqrt(t*(1-t));
   const e = Math.exp(-Math.pow(3*Math.pow(Math.PI*si*r,2) * k / 2, 1/3));
   console.log(`Expected p: ${e}`);
   console.log(`Actual p: ${tot/s} (with sigma)`);
   console.log(`Used ${s} iterations`);
   return tot/s;
}

class ControlPanel {
   constructor(p, t, graph) {
      this.p = p;
      this.t = t;
      this.d = Math.exp(D(this.t, this.p));
      this.dirty = true;
      this.graph = graph;

      this.playInterval = null;
   }
   mount(node, fixed_n) {
      this.node = node;
      this.create(node);
      this.reset(fixed_n);
   }
   reset(fixed_n) {
      let n;
      if (!fixed_n) {
         const ideal_d = Math.exp(D(this.t, this.p));
         if (Math.abs(this.d - ideal_d) < .1) {
            const surv = simulate(this.t, this.p, this.d, 15);
            n = Math.ceil(1/surv);
         } else {
            n = 20;
         }
      } else {
         n = fixed_n;
      }
      this.graph.reset(n, this.p, this.t, this.d);
      this.graph.update();
      this.dirty=false;
      this.update();
   }
   update() {
      this.node.select('#play_button')
         .html(this.playInterval ?
            '<i class="material-icons">pause</i> Pause'
            : '<i class="material-icons">play_arrow</i> Play');
      this.node.select('#step_button')
         .html('<i class="material-icons">skip_next</i> Step');
      this.node.select('#reset_button')
         .html('<i class="material-icons">stop</i> Refresh'
         + (this.dirty ? '*' : ''));
      this.p_slider.silentValue(this.p);
      this.t_slider.silentValue(this.t);
      this.d_slider.silentValue(this.d);
      this.d_slider = this.d_slider.max(Math.ceil(this.d));
      d3.select('#d_slider').call(this.d_slider);
   }
   create(form) {
      // Make buttons
      const step = () => {
         this.graph.step();
         this.graph.update();
         if (!this.graph.isAlive()) {
            this.playInterval = clearInterval(this.playInterval);
            this.update();
         }
      }
      const buttons = form.append('div').attr('class','buttons');
      buttons.append('button').attr('id', 'play_button')
         .on('click', () => {
            if (this.playInterval) {
               this.playInterval = clearInterval(this.playInterval);
            } else {
               step();
               this.playInterval = setInterval(step, 1100);
            }
            this.update();
         });
      buttons.append('button')
         .attr('id', 'step_button')
         .on('click', step);
      buttons.append('button')
         .attr('id', 'reset_button')
         .on('click', () => this.reset());

      const slider_width = 120;
      const sliders = form.append('div').attr('style', 'display:flex; clear:both');
      let p = sliders.append('p').attr('class', 'slider');
      p.append('label')
         .html('Increment probability <span class="math">(p)</span>')
         .append('i')
         .lower()
         .attr('class', 'tooltip material-icons')
         .text('info')
         .append('span')
         .attr('class', 'tooltip-text')
         .text('An individuals fitness increases with 1 compared to its parent with this probability.');
      this.p_slider = d3.sliderBottom().width(slider_width)
         .min(0.01)
         .max(0.99)
         .tickFormat(d3.format('.2%'))
         .ticks(3)
         .default(this.p)
         .on('onchange', val => {
            this.p = val;
            this.d = Math.exp(D(this.t, this.p));
            this.dirty=true;
            this.update()
         });
      p.append('svg') .append('g') .call(this.p_slider);

      p = sliders.append('p').attr('class', 'slider');
      p.append('label')
         .html('Survival treshold <span class="math">(t)</span>')
         .append('i') .lower() .attr('class', 'tooltip material-icons') .text('info') .append('span') .attr('class', 'tooltip-text')
         .html('An individual is allowed to survive the kth round, if its fitness is at least <span class="math">t · k - (t(1-t)k)<sup>1/3</sup></math>.');
      this.t_slider = d3.sliderBottom().width(slider_width)
         .min(0)
         .max(1)
         .tickFormat(d3.format('.2%'))
         .ticks(2)
         .default(this.p)
         .on('onchange', val => {
            this.t = val;
            this.d = Math.exp(D(this.t, this.p));
            this.dirty=true;
            this.update()
         });
      p.append('svg') .append('g') .call(this.t_slider);

      p = sliders.append('p').attr('class', 'slider');
      p.append('label')
         .html('Branching factor <span class="math">(Δ)</span>')
         .append('i') .lower() .attr('class', 'tooltip material-icons') .text('info') .append('span') .attr('class', 'tooltip-text')
         .html('Each individual that survives splits inito <span class="math">Δ</span> descendants, each inheriting the fitness of the parent.');
      this.d_slider = d3.sliderBottom().width(slider_width)
         .min(1)
         .max(Math.ceil(2*this.d))
         .tickFormat(d3.format('.5'))
         .ticks(3)
         .default(this.d)
         .on('onchange', val => {
            this.d = val;
            this.dirty=true;
            this.update()
         });
      p.append('svg') .append('g').attr('id','d_slider') .call(this.d_slider);

   }
}
