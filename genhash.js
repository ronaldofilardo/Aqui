const b=require('bcryptjs');b.hash('123456',12).then(h=>{console.log(h);process.exit()})
