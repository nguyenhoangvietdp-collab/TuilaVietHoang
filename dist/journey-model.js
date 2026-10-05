export const CHAPTERS = [
  {id:'fields',name:'Trường học',label:'01 / TRƯỜNG HỌC',mediaKey:'school'},
  {id:'about',name:'Giới thiệu cá nhân',label:'02 / GIỚI THIỆU CÁ NHÂN',mediaKey:'personal'},
  {id:'journey',name:'Kinh nghiệm',label:'03 / KINH NGHIỆM',mediaKey:'experience'},
  {id:'work',name:'Câu chuyện ngoài lề',label:'04 / CÂU CHUYỆN NGOÀI LỀ',mediaKey:'life'}
];
export function subjourneys(data) {
  const defaults = {
    fields: [
      {id:'beginnings',title:'Những ngày đầu',summary:'Bổ sung ngôi trường, giai đoạn học tập đầu tiên và những điều đáng nhớ.',period:'Mốc học tập · Chờ bổ sung'},
      {id:'learning',title:'Học tập & hoạt động',summary:'Bổ sung các giai đoạn tiếp theo, hoạt động và trải nghiệm trong trường.',period:'Mốc học tập · Chờ bổ sung'},
      {id:'memories',title:'Kỷ niệm & bài học',summary:'Bổ sung những người, kỷ niệm và bài học mang theo sau mỗi chặng.',period:'Điều đọng lại · Chờ bổ sung'}
    ],
    about: (data.profile.values || []).map((value,index)=>({id:'perspective-'+(index+1),title:value.title,summary:'Bổ sung câu chuyện cá nhân về '+String(value.detail || value.title).toLocaleLowerCase('vi')+'.',period:'Một góc nhìn về Việt'})),
    journey: data.chapters.map(stage=>({id:stage.id,title:stage.title,summary:stage.summary,period:stage.period,media:stage.media,children:(stage.milestones || []).map((item,index)=>({id:'moment-'+(index+1),title:item.label,summary:item.text,media:item.media}))})),
    work: data.projects.map(project=>({id:project.id,title:project.title,summary:project.summary,media:project.media,projectId:project.id}))
  };
  return Object.fromEntries(CHAPTERS.map(chapter=>[chapter.id,data.subjourneys?.[chapter.id] ?? defaults[chapter.id]]));
}
export function flattenSteps(chapterId,steps,parents=[],numbers=[]) {
  return steps.flatMap((step,index)=> {
    const path=[...parents,step.id], number=[...numbers,index+1];
    const node={...step,key:[chapterId,...path].join('/'),domId:'step-'+[chapterId,...path].join('--'),depth:parents.length,number:number.join('.'),ancestors:parents};
    return [node,...flattenSteps(chapterId,step.children || [],path,number)];
  });
}
// The single document scroll position is authoritative for both columns.
export function activeAt(nodes,readingLine) {
  let selected=nodes[0];
  for(const node of nodes) if(node.top<=readingLine+.5)selected=node;
  return selected;
}
export function clampProgress(top,height,readingLine) {
  return Math.max(0,Math.min(1,(readingLine-top)/Math.max(1,height)));
}
