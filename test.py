# -*- coding:utf-8 -*-

import pandas as pd
import datetime
import matplotlib
from matplotlib import pyplot as plt
import seaborn
import numpy as np
%matplotlib inline
matplotlib.rcParams['figure.figsize'] = (16, 5)
#读取原始数据
user_df=pd.read_csv('../data/tianchi_mobile_recommend_train_user.csv')
item_df=pd.read_csv('../data/tianchi_mobile_recommend_train_item.csv')
#查看数据总量
print('用户数量：',user_df.user_id.unique().shape[0])
print('商品总数量：',user_df.item_id.unique().shape[0])
print('操作记录总数：',len(user_df))
print('要预测的商品总数量:',item_df.item_id.unique().shape[0])


# 只预测这个set中出现的商品
item_id_set=set(item_df.item_id)
print('要预测的商品总数量:',len(item_id_set))
#数据格式转换
%%time
user_df['day']=user_df.time.apply(lambda x:datetime.datetime.strptime(x[:-3], "%Y-%m-%d"))
user_df['hour']=user_df.time.apply(lambda x:int(x[-2:]))

#做一些数据统计
print('每种行为的数量')
pd.DataFrame(user_df.behavior_type.value_counts())

print('每天的行为数量')
pd.DataFrame(user_df.day.value_counts()).plot()

#将12月17日的购物车的商品作为预测结果
def submit(result_df,filename='../data/submission.csv'):
    result_df=result_df.loc[:,['user_id','item_id']].drop_duplicates()
    print('结果共有：',len(result_df),'条数据')
    result_df.to_csv(filename,index=False)
    
result_df=user_df[(user_df.day=='2014-12-17')&(user_df.behavior_type==3)]
# 筛选出要预测的商品，因为我们只评估这部分商品
result_df=result_df[result_df.item_id.apply(lambda id:id in item_id_set)]
submit(result_df,'../data/submission1.csv')

#将12月17日最后400条加入购物车的商品记录作为预测结果
#为什么选择400条，因为统计出来历史记录中，每天平均有400条购买记录
o2o_user_df=user_df[user_df.item_id.apply(lambda id:id in item_id_set)]
buy_cnt=o2o_user_df[o2o_user_df.behavior_type==4].drop_duplicates(subset=['user_id','item_id','day']).day.value_counts()
pd.DataFrame(buy_cnt).plot()
plt.title('Buy Count Per Day')

result_df=result_df.sort_values('hour',ascending=False).loc[:,['user_id','item_id']].drop_duplicates()
result_df=result_df.iloc[:400]
submit(result_df,'../data/submission2.csv')

#机器学习方法
user_df=user_df[user_df.day>='2014-12-14']
o2o_user_df=o2o_user_df[o2o_user_df.day>='2014-12-14']
print('数据个数：',len(user_df))
print('与要预测商品相关的数据个数',len(o2o_user_df))

def get_answer_dict(date):
    answer = user_df[(user_df.day==date)&(user_df.behavior_type==4)]
    answer = set(answer.apply(lambda item:'%s-%s'%(item.user_id,item.item_id),axis=1))
    return answer

def label_it(train_xs_df,target_date):
    answer=get_answer_dict(target_date)
    train_xs_df['label']=train_xs_df.apply(lambda item:1 if '%d-%d'%(item.user_id,item.item_id) in answer else 0,axis=1)
    return train_xs_df

#抽取特征
%%time

def get_features(target_date,user_df):
    xs=[]
    cnt=0
    #target_date=datetime.datetime(2014,12,17)
    start_date=target_date-datetime.timedelta(2)
    tmp_df=user_df[(user_df.day>=start_date)&(user_df.day<target_date)]

    for gid,items in tmp_df.groupby(by=['user_id','item_id']):
        user_id,item_id=gid
        x=[user_id,item_id]
        vals=np.zeros([2,3,4])
        for item in items.itertuples():
            day=(target_date-item.day).days-1
            hour=int(item.hour/8)
            behavior=item.behavior_type-1
            vals[day][hour][behavior]+=1
        x.extend(list(vals.reshape((24))))
        xs.append(x)
        cnt+=1
        if cnt%10000==0:
            print(datetime.datetime.now(),'processed %d'%(cnt,))

    headers=['user_id','item_id']
    for i in range(2):
        for j in range(3):
            for k in range(4):
                headers.append('d%d_h%d_b%d'%(i+1,j+1,k+1))
    xs_df=pd.DataFrame(xs,columns=headers)
return xs_df

%%time
train_xs_df=get_features(datetime.datetime(2014,12,16),user_df)
print(datetime.datetime.now(),'train_xs_df processed')
# 验证集和测试集只使用o2o的商品就可以了
valid_xs_df=get_features(datetime.datetime(2014,12,17),o2o_user_df)
print(datetime.datetime.now(),'valid_xs_df processed')
test_xs_df=get_features(datetime.datetime(2014,12,18),o2o_user_df)
print(datetime.datetime.now(),'test_xs_df processed')

label_it(train_xs_df,datetime.datetime(2014,12,16))
label_it(valid_xs_df,datetime.datetime(2014,12,17))

positive_num=np.sum(train_xs_df.label)
negative_num=len(train_xs_df)-positive_num
print('正样本个数',positive_num,'负样本个数',negative_num,'负正样本比例',negative_num/positive_num)

#正样本过采样：
positive_xs_df=train_xs_df[train_xs_df.label==1]
positive_xs_df=positive_xs_df.sample(n=40000,replace=True)
sample_xs_df=pd.concat([train_xs_df,positive_xs_df])
sample_xs_df=sample_xs_df.sample(frac=1.0)

from sklearn.linear_model.logistic import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import Normalizer
from sklearn.metrics import precision_recall_fscore_support,precision_score,recall_score,f1_score

#对特征进行归一化处理
scaler=Normalizer(norm='l1')
scaler.fit(sample_xs_df.drop(['user_id','item_id','label']))

train_xs=scaler.transform(sample_xs_df.drop(['user_id','item_id','label'],axis=1))
valid_xs=scaler.transform(valid_xs_df.drop(['user_id','item_id','label'],axis=1))
test_xs=scaler.transform(test_xs_df.drop(['user_id','item_id'],axis=1))

answer_cnt=len(o2o_user_df[(o2o_user_df.day=='2014-12-17')&(o2o_user_df.behavior_type==4)])
def evaluate(ytrue,ypred,answer_cnt):
    ypred=ypred>0.5
    right_cnt=np.sum(ytrue&ypred)
    predict_cnt=np.sum(ypred)
    precision=right_cnt/predict_cnt
    recall=right_cnt/answer_cnt
    f1=0
    if precision>0 or recall>0:
        f1=2*precision*recall/(precision+recall)
    print('预测数量',predict_cnt,'答案数量',answer_cnt)
    print('正确个数',right_cnt)
    print('precision',precision)
    print('recall',recall)
    print('f1',f1)
    return precision,recall,f1

#使用GBDT模型

clf=GradientBoostingClassifier(n_estimators=50)
clf.fit(train_xs,sample_xs_df.label)
# 这里可以用predict也可以用predict_proba
# predict只输出0和1，
# predict_proba 可以输出概率值
valid_yp=clf.predict_proba(valid_xs)[:,1]
test_yp=clf.predict_proba(test_xs)[:,1]
evaluate(valid_xs_df.label,valid_yp,answer_cnt)
test_xs_df['yp']=test_yp
submit(test_xs_df[test_xs_df.yp>0.71],filename='../data/submission_gbdt1.csv')
