// Just adds controls to display the data
// 


// Lacunarity,
// Persistence,
// octaves
// scale
// seaLevel
// Oceanlevel? - how deep to say it's ocean
// Ocean distance - how far ocean from coast

// create slider and return object to get its info
export function AddSlider(name, min, max, step, value){
    const div = document.createElement('div');
    const slider = document.createElement('input');
    const label = document.createElement('label');

    div.appendChild(label);
    div.appendChild(slider);

    value = value ?? min;

    slider.type = "range";
    slider.id = name + "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;

    label.for = name + "range";
    label.textContent = name;
}

function LinkSlider(slider){
    slider.addEventListener('input', ()=> {
        
    })
}
