const mongoose=require('mongoose');



const DadabaseConnection=async()=>{
    try{
      const db=await  mongoose.connect(process.env.MONGODB_URL)
      if(db){
        console.log('mongodb connected successfully');
        
      }

    }catch(error){
        console.log('error to conect db');
        
    }
  
}


module.exports=DadabaseConnection