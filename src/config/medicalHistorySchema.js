export const MEDICAL_HISTORY_GROUPS = [
  {
    groupKey: 'ascvdDiagnoses',
    promptPath: ['questions', 'ascvd', 'prompt'],
    fallbackPrompt: '請問你是否經臨床檢查確診為 動脈硬化心血管疾病，包含（請勾選，可多選）：',
    options: [
      {
        key: 'acuteCoronarySyndrome',
        labelPath: ['questions', 'ascvd', 'options', 'acuteCoronarySyndrome'],
        fallbackLabel: '1)  急性冠心症病史',
      },
      {
        key: 'revascularization',
        labelPath: ['questions', 'ascvd', 'options', 'revascularization'],
        fallbackLabel: '2)  接受冠狀動脈血管再通術(心導管介入治療或外科冠狀動脈繞道手術)',
      },
      {
        key: 'ischemicStroke',
        labelPath: ['questions', 'ascvd', 'options', 'ischemicStroke'],
        fallbackLabel: '3)  缺血性中風/短暫性腦缺血發作合併動脈硬化相關疾病或病史',
      },
      {
        key: 'peripheralArteryDisease',
        labelPath: ['questions', 'ascvd', 'options', 'peripheralArteryDisease'],
        fallbackLabel: '4)  周邊動脈疾病 (曾接受血管再通術、有間歇性跛行相關症狀或截肢)',
      },
      {
        key: 'none',
        labelPath: ['questions', 'ascvd', 'options', 'none'],
        fallbackLabel: '5)  以上皆無',
        isNone: true,
      },
    ],
  },
  {
    groupKey: 'imagingFindings',
    promptPath: ['questions', 'imaging', 'prompt'],
    fallbackPrompt: '請問你是否經影像檢查確認有 顯著斑塊負擔，定義為≥50%直徑狹窄，包含（請勾選，可多選）：',
    options: [
      {
        key: 'coronaryAngiography',
        labelPath: ['questions', 'imaging', 'options', 'coronaryAngiography'],
        fallbackLabel: '1)  冠狀動脈血管攝影',
      },
      {
        key: 'coronaryCt',
        labelPath: ['questions', 'imaging', 'options', 'coronaryCt'],
        fallbackLabel: '2)  冠狀動脈或周邊動脈電腦斷層掃描',
      },
      {
        key: 'vascularUltrasound',
        labelPath: ['questions', 'imaging', 'options', 'vascularUltrasound'],
        fallbackLabel: '3)  頸動脈或周邊動脈血管超音波',
      },
      {
        key: 'none',
        labelPath: ['questions', 'imaging', 'options', 'none'],
        fallbackLabel: '4)  以上皆無',
        isNone: true,
      },
    ],
  },
  {
    groupKey: 'cadComplications',
    promptPath: ['questions', 'cad', 'prompt'],
    fallbackPrompt: '請問你是否被診斷有 冠狀動脈疾病 合併下列任一臨床狀況（請勾選，可多選）：',
    options: [
      {
        key: 'miWithin1Year',
        labelPath: ['questions', 'cad', 'options', 'miWithin1Year'],
        fallbackLabel: '1)  一年內曾歷經心肌梗塞',
      },
      {
        key: 'miHistoryTwoOrMore',
        labelPath: ['questions', 'cad', 'options', 'miHistoryTwoOrMore'],
        fallbackLabel: '2)  ≥兩次心肌梗塞病史',
      },
      {
        key: 'multiVesselObstruction',
        labelPath: ['questions', 'cad', 'options', 'multiVesselObstruction'],
        fallbackLabel: '3)  多支冠狀動脈阻塞',
      },
      {
        key: 'acsWithDiabetes',
        labelPath: ['questions', 'cad', 'options', 'acsWithDiabetes'],
        fallbackLabel: '4)  急性冠心症合併糖尿病',
      },
      {
        key: 'padOrCarotid',
        labelPath: ['questions', 'cad', 'options', 'padOrCarotid'],
        fallbackLabel: '5)  周邊動脈疾病或頸動脈狹窄',
      },
      {
        key: 'none',
        labelPath: ['questions', 'cad', 'options', 'none'],
        fallbackLabel: '6)  以上皆無',
        isNone: true,
      },
    ],
  },
  {
    groupKey: 'padComplications',
    promptPath: ['questions', 'pad', 'prompt'],
    fallbackPrompt: '請問你是否被診斷有 周邊動脈疾病 合併有以下任一臨床狀況（請勾選，可多選）：',
    options: [
      {
        key: 'cad',
        labelPath: ['questions', 'pad', 'options', 'cad'],
        fallbackLabel: '1)  冠狀動脈疾病',
      },
      {
        key: 'carotidStenosis',
        labelPath: ['questions', 'pad', 'options', 'carotidStenosis'],
        fallbackLabel: '2)  頸動脈狹窄',
      },
      {
        key: 'none',
        labelPath: ['questions', 'pad', 'options', 'none'],
        fallbackLabel: '3)  以上皆無',
        isNone: true,
      },
    ],
  },
]
