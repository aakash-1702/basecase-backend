import {nanoid} from 'nanoid';
 
const generateSlug = ( title) =>{
    let slug = title
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric characters with hyphens
                    .replace(/^-+|-+$/g, ''); // remove leading and trailing hyphens    
    const uniqueId = nanoid(6);
    slug = `${slug}-${uniqueId}`;                    
    return slug;
}

export default generateSlug;